import { Injectable, Logger } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { Database, type DbExecutor } from "../../../shared/db/database";
import { newId } from "../../../shared/db/columns";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { StorageUnavailableError } from "../../../shared/storage/storage.errors";
import { StorageService } from "../../../shared/storage/storage.service";
import {
  AlreadyAppliedError,
  applicationPayloadSchema,
  type ApplicationStatus,
  displayFileName,
  type ListApplicationsQuery,
  normalizeEmail,
  normalizePhone,
  NotAcceptingApplicationsError,
  RESUME_LINK_SECONDS,
  type ResumeFile,
  resumeKeyCandidates,
  resumeProblem,
  type UpdateApplicationInput,
} from "../domain/application";
import { dhakaDate, isAcceptingApplications } from "../domain/job";
import { ApplicationsRepo } from "../repo/applications.repo";
import { JobsRepo } from "../repo/jobs.repo";

interface ApplicationListRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: Date;
}

interface ApplicationDetailRow extends ApplicationListRow {
  jobId: string;
  jobTitle: string;
  jobSlug: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  resumeName: string;
  resumeSize: number;
  notes: string | null;
  consentedAt: Date;
  updatedAt: Date;
}

const listItem = (row: ApplicationListRow) => ({
  id: row.id,
  fullName: row.fullName,
  email: row.email,
  phone: row.phone,
  status: row.status as ApplicationStatus,
  createdAt: row.createdAt.toISOString(),
});

/**
 * Use cases for applications. The submission is called by the website's server (shared key); the rest are for employees and
 * declare `recruitment.application.read` / `.update` on the endpoints. Nothing here logs or audits a candidate's details:
 * ids and changed field names only.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
/** A new application that has waited this long shows up on the dashboard's worklist. */
const STALE_AFTER_DAYS = 3;
/** An open position whose last day is within this many days counts as closing soon. */
const CLOSING_SOON_DAYS = 7;

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly database: Database,
    private readonly applications: ApplicationsRepo,
    private readonly jobs: JobsRepo,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Stores a candidate's application and resume. Safe to retry with the same `submissionId`. The resume goes to the private
   * bucket first, then the rows are written in one transaction; if that fails, the uploaded file is removed again.
   */
  async submit(slug: string, rawPayload: unknown, resume: ResumeFile | null): Promise<{ id: string }> {
    const now = new Date();
    const db = this.database.db;

    const job = await this.jobs.findBySlug(db, slug);
    if (!job || job.status === "draft") throw new NotFoundError("Job not found");

    const parsed = applicationPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      throw new ValidationError(
        "The application is not valid",
        parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      );
    }
    const input = parsed.data;

    // A retry of something already stored succeeds, even if the job has closed in the meantime.
    const earlier = await this.applications.findBySubmission(db, input.submissionId);
    if (earlier) {
      if (earlier.jobId !== job.id) throw new ConflictError("This submission id was already used for another position");
      return { id: earlier.id };
    }

    if (!isAcceptingApplications(job, now)) throw new NotAcceptingApplicationsError();

    const questions = await this.jobs.listQuestions(db, job.id);
    const answers = this.checkAnswers(questions, input.answers);

    const resumeIssue = resumeProblem(resume);
    if (resumeIssue || !resume) throw new ValidationError(resumeIssue ?? "Attach your resume as a PDF", { resume: resumeIssue });

    const emailNormalized = normalizeEmail(input.email);
    const phoneNormalized = normalizePhone(input.phone);
    if (!phoneNormalized) throw new ValidationError("Enter a valid phone number"); // already checked by the schema

    if (await this.applications.isDuplicate(db, job.id, emailNormalized, phoneNormalized)) throw new AlreadyAppliedError();

    const id = newId();
    const key = await this.storeResume(job.title, resume, id);

    let stored: boolean;
    try {
      stored = await this.database.transaction(async (tx) => {
        const inserted = await this.applications.insert(
          tx,
          {
            id,
            jobId: job.id,
            submissionId: input.submissionId,
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            emailNormalized,
            phoneNormalized,
            githubUrl: input.githubUrl,
            linkedinUrl: input.linkedinUrl,
            resumeKey: key,
            resumeName: displayFileName(resume.filename),
            resumeSize: resume.buffer.length,
            consentedAt: now,
          },
          input.educations,
          input.experiences,
          answers,
        );
        // Ids only: nothing the candidate typed goes into the audit log.
        if (inserted) {
          await this.audit.record(
            { action: "recruitment.application.submitted", entityType: "application", entityId: id, metadata: { jobId: job.id } },
            tx,
          );
        }
        return inserted;
      });
    } catch (error) {
      await this.discardResume(key);
      throw error;
    }

    if (!stored) {
      // A unique index caught a simultaneous double submit that passed the checks above.
      await this.discardResume(key);
      const sameSubmission = await this.applications.findBySubmission(db, input.submissionId);
      if (sameSubmission) return { id: sameSubmission.id };
      throw new AlreadyAppliedError();
    }
    return { id };
  }

  /**
   * Uploads the resume as `career/<job title>/<file name>.pdf`. If that name is taken (two candidates both called theirs
   * `resume.pdf`), the next free name is used instead, so nobody's file is ever replaced. Returns the key that was used.
   */
  private async storeResume(jobTitle: string, resume: ResumeFile, applicationId: string): Promise<string> {
    for (const key of resumeKeyCandidates(jobTitle, resume.filename, applicationId)) {
      if (await this.storage.putIfAbsent(key, resume.buffer, "application/pdf")) return key;
    }
    // Every name is taken, which cannot happen for a fresh application id: treat it as a storage problem.
    this.logger.error("No free resume name was found");
    throw new StorageUnavailableError();
  }

  async listForJob(jobId: string, query: ListApplicationsQuery) {
    if (!(await this.jobs.findById(this.database.db, jobId))) throw new NotFoundError("Job not found");
    const { items, total } = await this.applications.list({
      jobId,
      status: query.status,
      q: query.q || undefined,
      sort: query.sort,
      order: query.order,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return { items: items.map(listItem), total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string) {
    return this.database.transaction((tx) => this.load(tx, id));
  }

  async update(id: string, input: UpdateApplicationInput, actorId: string) {
    return this.database.transaction(async (tx) => {
      const patch: { status?: ApplicationStatus; notes?: string | null } = {};
      if (input.status !== undefined) patch.status = input.status;
      // An empty note clears it.
      if (input.notes !== undefined) patch.notes = input.notes ? input.notes : null;

      if (!(await this.applications.update(tx, id, patch, actorId))) throw new NotFoundError("Application not found");
      await this.audit.record(
        {
          action: "recruitment.application.updated",
          actorId,
          entityType: "application",
          entityId: id,
          metadata: { fields: Object.keys(patch), ...(patch.status ? { status: patch.status } : {}) },
        },
        tx,
      );
      return this.load(tx, id);
    });
  }

  /**
   * Figures for the dashboard: open positions, those closing within a week, applications nobody has looked at, and the oldest of
   * those that have waited longer than `STALE_AFTER_DAYS`. Counts only; no candidate text beyond a name for the worklist.
   */
  async stats(now: Date = new Date()) {
    const closingBy = dhakaDate(new Date(now.getTime() + CLOSING_SOON_DAYS * DAY_MS));
    const staleBefore = new Date(now.getTime() - STALE_AFTER_DAYS * DAY_MS);
    const result = await this.applications.dashboardStats(dhakaDate(now), closingBy, staleBefore);
    return {
      ...result,
      stale: result.stale.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
      closingSoonDays: CLOSING_SOON_DAYS,
      staleAfterDays: STALE_AFTER_DAYS,
    };
  }

  /** A link to the resume that works for five minutes. Every request is written to the audit log. */
  async resumeLink(id: string, actorId: string) {
    const db = this.database.db;
    const resume = await this.applications.findResume(db, id);
    if (!resume) throw new NotFoundError("Application not found");
    if (!(await this.storage.head(resume.resumeKey))) throw new NotFoundError("The resume file is missing");

    const link = await this.storage.signedGetUrl(resume.resumeKey, RESUME_LINK_SECONDS);
    await this.audit.record({
      action: "recruitment.application.resume_viewed",
      actorId,
      entityType: "application",
      entityId: id,
      metadata: { jobId: resume.jobId },
    });
    return { url: link.url, expiresAt: link.expiresAt.toISOString() };
  }

  private async load(tx: DbExecutor, id: string) {
    const row: ApplicationDetailRow | null = await this.applications.findDetail(tx, id);
    if (!row) throw new NotFoundError("Application not found");
    // One after another: inside a transaction every query shares a single connection.
    const educations = await this.applications.educations(tx, id);
    const experiences = await this.applications.experiences(tx, id);
    const answers = await this.applications.answers(tx, id);
    return {
      ...listItem(row),
      jobId: row.jobId,
      jobTitle: row.jobTitle,
      jobSlug: row.jobSlug,
      githubUrl: row.githubUrl,
      linkedinUrl: row.linkedinUrl,
      resume: { name: row.resumeName, size: row.resumeSize },
      notes: row.notes ?? "",
      consentedAt: row.consentedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      educations: educations.map((education) => ({ ...education, grade: education.grade ?? "" })),
      experiences,
      answers,
    };
  }

  /** Every required question needs a real answer, and only the job's active questions may be answered, each once. */
  private checkAnswers(
    questions: { id: string; text: string; required: boolean }[],
    given: { questionId: string; answer: string }[],
  ) {
    const known = new Map(questions.map((question) => [question.id, question]));
    const answered = new Map<string, string>();
    for (const item of given) {
      if (!known.has(item.questionId)) {
        throw new ValidationError("An answer belongs to a question that is not on this position", { answers: item.questionId });
      }
      if (answered.has(item.questionId)) throw new ValidationError("A question was answered twice", { answers: item.questionId });
      answered.set(item.questionId, item.answer);
    }
    const missing = questions.filter((question) => question.required && !answered.get(question.id));
    if (missing.length > 0) {
      throw new ValidationError(
        "Answer every required question",
        missing.map((question) => ({ path: `answers.${question.id}`, message: "This question needs an answer" })),
      );
    }
    // A blank answer to an optional question is not stored. The question text is copied so later edits never rewrite history.
    return questions
      .filter((question) => answered.get(question.id))
      .map((question) => ({ questionId: question.id, questionText: question.text, answer: answered.get(question.id) ?? "" }));
  }

  /** Best effort: a leftover object is harmless (the key holds only ids) and a future cleanup can find it. */
  private async discardResume(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch {
      this.logger.warn(`Could not remove an uploaded resume after a failed application: ${key}`);
    }
  }
}
