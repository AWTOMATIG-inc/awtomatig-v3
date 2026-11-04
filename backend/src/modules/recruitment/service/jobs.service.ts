import { randomBytes } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { Database, type Tx } from "../../../shared/db/database";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import {
  buildSlug,
  type CreateJobInput,
  deadlineProblem,
  dhakaDate,
  isAcceptingApplications,
  type JobStatus,
  type JobType,
  type ListJobsQuery,
  normalizeAmount,
  type QuestionInput,
  type ReopenJobInput,
  salaryProblem,
  type UpdateJobInput,
  type WorkMode,
} from "../domain/job";
import { ApplicationsRepo } from "../repo/applications.repo";
import { type JobPatch, JobsRepo } from "../repo/jobs.repo";

interface JobSummaryRow {
  id: string;
  slug: string;
  title: string;
  jobType: string;
  workMode: string;
  vacancies: number;
  location: string;
  deadlineOn: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
}

interface JobDetailRow extends JobSummaryRow {
  salaryMin: string | null;
  salaryMax: string | null;
  salaryCurrency: string;
  officeTiming: string;
  description: string;
  requirements: string;
  benefits: string;
  closedAt: Date | null;
  updatedAt: Date;
}

interface QuestionRow {
  id: string;
  position: number;
  text: string;
  required: boolean;
}

/** How many times a new job retries with a fresh slug suffix before giving up (a clash needs a 24-bit collision). */
const SLUG_ATTEMPTS = 5;

/** Applications for one job: all of them, and the ones nobody has looked at yet. */
interface ApplicationCounts {
  total: number;
  fresh: number;
}

/** How long a closed or lapsed job stays on the public list, counted from its last day. */
const CLOSED_VISIBLE_DAYS = 30;

const NO_APPLICATIONS: ApplicationCounts = { total: 0, fresh: 0 };

const summary = (row: JobSummaryRow, now: Date, counts: ApplicationCounts) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  jobType: row.jobType as JobType,
  workMode: row.workMode as WorkMode,
  vacancies: row.vacancies,
  location: row.location,
  deadlineOn: row.deadlineOn,
  status: row.status as JobStatus,
  acceptingApplications: isAcceptingApplications(row, now),
  publishedAt: row.publishedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
  applicationCount: counts.total,
  newApplicationCount: counts.fresh,
});

const detail = (row: JobDetailRow, questions: QuestionRow[], now: Date, counts: ApplicationCounts) => ({
  ...summary(row, now, counts),
  salaryMin: normalizeAmount(row.salaryMin),
  salaryMax: normalizeAmount(row.salaryMax),
  salaryCurrency: row.salaryCurrency,
  officeTiming: row.officeTiming,
  description: row.description,
  requirements: row.requirements,
  benefits: row.benefits,
  closedAt: row.closedAt?.toISOString() ?? null,
  updatedAt: row.updatedAt.toISOString(),
  questions: questions.map((question) => ({
    id: question.id,
    position: question.position,
    text: question.text,
    required: question.required,
  })),
});

const questionList = (questions: QuestionRow[]) =>
  questions.map((question) => ({
    id: question.id,
    position: question.position,
    text: question.text,
    required: question.required,
  }));

interface PublicJobRow extends JobSummaryRow {
  salaryMin: string | null;
  salaryMax: string | null;
  officeTiming: string;
}

/**
 * What the public website may see of a job: an allow-list, never the raw row. No status, no audit columns, no internal ids
 * other than the question ids the application form must send back.
 */
const publicSummary = (row: PublicJobRow, now: Date) => ({
  slug: row.slug,
  title: row.title,
  jobType: row.jobType as JobType,
  workMode: row.workMode as WorkMode,
  vacancies: row.vacancies,
  location: row.location,
  officeTiming: row.officeTiming,
  salaryMin: normalizeAmount(row.salaryMin),
  salaryMax: normalizeAmount(row.salaryMax),
  deadlineOn: row.deadlineOn,
  publishedAt: row.publishedAt?.toISOString() ?? null,
  acceptingApplications: isAcceptingApplications(row, now),
});

/**
 * Use cases for job openings. Permissions are declared on the endpoints (`recruitment.job.read` / `.create` / `.update`).
 * Every change writes an audit entry with ids and changed field names only.
 */
@Injectable()
export class JobsService {
  constructor(
    private readonly database: Database,
    private readonly repo: JobsRepo,
    private readonly applications: ApplicationsRepo,
    private readonly audit: AuditService,
  ) {}

  async create(input: CreateJobInput, actorId: string) {
    const now = new Date();
    const problem = deadlineProblem(input.deadlineOn, now);
    if (problem) throw new ValidationError(problem, { deadlineOn: problem });

    return this.database.transaction(async (tx) => {
      const status: JobStatus = input.publish ? "open" : "draft";
      let id: string | null = null;
      for (let attempt = 0; attempt < SLUG_ATTEMPTS && id === null; attempt++) {
        const inserted = await this.repo.insertJob(tx, {
          slug: buildSlug(input.title, randomBytes(3).toString("hex")),
          title: input.title,
          jobType: input.jobType,
          workMode: input.workMode,
          salaryMin: input.salaryMin,
          salaryMax: input.salaryMax,
          vacancies: input.vacancies,
          officeTiming: input.officeTiming,
          location: input.location,
          description: input.description,
          requirements: input.requirements,
          benefits: input.benefits,
          deadlineOn: input.deadlineOn,
          status,
          publishedAt: input.publish ? now : null,
          createdBy: actorId,
        });
        id = inserted?.id ?? null;
      }
      if (id === null) throw new Error("Could not find a free slug for the job");

      await this.repo.insertQuestions(
        tx,
        id,
        input.questions.map((question, position) => ({ position, text: question.text, required: question.required })),
        actorId,
      );
      await this.audit.record(
        {
          action: "recruitment.job.created",
          actorId,
          entityType: "job",
          entityId: id,
          metadata: { status, questions: input.questions.length },
        },
        tx,
      );
      return this.load(tx, id, now);
    });
  }

  async list(query: ListJobsQuery) {
    const now = new Date();
    const { items, total } = await this.repo.list({
      status: query.status,
      q: query.q || undefined,
      sort: query.sort,
      order: query.order,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    const counts = await this.applications.countByJobs(
      this.database.db,
      items.map((row) => row.id),
    );
    return {
      items: items.map((row) => summary(row, now, counts.get(row.id) ?? NO_APPLICATIONS)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async get(id: string) {
    return this.database.transaction((tx) => this.load(tx, id, new Date()));
  }

  async update(id: string, input: UpdateJobInput, actorId: string) {
    const now = new Date();
    return this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Job not found");

      const { questions, ...fields } = input;
      const patch = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as JobPatch;

      // The salary rules apply to the result, not just to the fields sent: sending only a new maximum must still fit the old minimum.
      const min = "salaryMin" in patch ? (patch.salaryMin ?? null) : normalizeAmount(row.salaryMin);
      const max = "salaryMax" in patch ? (patch.salaryMax ?? null) : normalizeAmount(row.salaryMax);
      const salary = salaryProblem(min, max);
      if (salary) throw new ValidationError(salary, { salaryMax: salary });

      if (patch.deadlineOn !== undefined && patch.deadlineOn !== row.deadlineOn) {
        const problem = deadlineProblem(patch.deadlineOn, now);
        if (problem) throw new ValidationError(problem, { deadlineOn: problem });
      }

      await this.repo.update(tx, id, patch, actorId);
      if (questions) await this.reconcileQuestions(tx, id, questions, actorId);

      await this.audit.record(
        {
          action: "recruitment.job.updated",
          actorId,
          entityType: "job",
          entityId: id,
          metadata: { fields: Object.keys(patch), ...(questions ? { questions: questions.length } : {}) },
        },
        tx,
      );
      return this.load(tx, id, now);
    });
  }

  /** A draft becomes visible to candidates. */
  async publish(id: string, actorId: string) {
    const now = new Date();
    return this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Job not found");
      if (row.status !== "draft") throw new ConflictError("Only a draft can be published");
      const problem = deadlineProblem(row.deadlineOn, now);
      if (problem) throw new ValidationError(`${problem}. Change the deadline first.`, { deadlineOn: problem });

      await this.repo.update(tx, id, { status: "open", publishedAt: now }, actorId);
      await this.recordStatus(tx, "published", id, actorId);
      return this.load(tx, id, now);
    });
  }

  /** Stops accepting applications at once. Existing applications are untouched. */
  async close(id: string, actorId: string) {
    const now = new Date();
    return this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Job not found");
      if (row.status !== "open") throw new ConflictError("Only an open job can be closed");

      await this.repo.update(tx, id, { status: "closed", closedAt: now }, actorId);
      await this.recordStatus(tx, "closed", id, actorId);
      return this.load(tx, id, now);
    });
  }

  /** A closed job takes applications again. Its deadline must be today or later, so pass a new one if the old one has passed. */
  async reopen(id: string, input: ReopenJobInput, actorId: string) {
    const now = new Date();
    return this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Job not found");
      if (row.status !== "closed") throw new ConflictError("Only a closed job can be reopened");

      const deadlineOn = input.deadlineOn ?? row.deadlineOn;
      const problem = deadlineProblem(deadlineOn, now);
      if (problem) throw new ValidationError(`${problem}. Send a new deadline to reopen.`, { deadlineOn: problem });

      await this.repo.update(tx, id, { status: "open", closedAt: null, deadlineOn }, actorId);
      await this.recordStatus(tx, "reopened", id, actorId);
      return this.load(tx, id, now);
    });
  }

  private async load(tx: Tx, id: string, now: Date) {
    const row = await this.repo.findById(tx, id);
    if (!row) throw new NotFoundError("Job not found");
    const counts = await this.applications.countByJobs(tx, [id]);
    return detail(row, await this.repo.listQuestions(tx, id), now, counts.get(id) ?? NO_APPLICATIONS);
  }

  /**
   * The openings on the careers page: those taking applications first (soonest deadline first), then jobs that closed or lapsed
   * within the last 30 days, flagged `acceptingApplications: false` so the page can show them as closed. Never a draft.
   */
  async listPublic() {
    const now = new Date();
    const rows = await this.repo.listVisible(
      this.database.db,
      dhakaDate(now),
      dhakaDate(new Date(now.getTime() - CLOSED_VISIBLE_DAYS * 86_400_000)),
    );
    return { items: rows.map((row) => publicSummary(row, now)) };
  }

  /**
   * One opening for the careers page. A closed or expired job is still returned (with `acceptingApplications: false`) so the page
   * can say so; a draft does not exist as far as the public is concerned.
   */
  async getPublic(slug: string) {
    const now = new Date();
    const row = await this.repo.findBySlug(this.database.db, slug);
    if (!row || row.status === "draft") throw new NotFoundError("Job not found");
    const questions = await this.repo.listQuestions(this.database.db, row.id);
    return {
      ...publicSummary(row, now),
      description: row.description,
      requirements: row.requirements,
      benefits: row.benefits,
      questions: questionList(questions),
    };
  }

  private recordStatus(tx: Tx, change: "published" | "closed" | "reopened", id: string, actorId: string) {
    return this.audit.record({ action: `recruitment.job.${change}`, actorId, entityType: "job", entityId: id }, tx);
  }

  /**
   * Makes the active questions match `wanted`: ones with an id are edited and moved, ones without are added, and any active
   * question left out is archived (never deleted).
   */
  private async reconcileQuestions(tx: Tx, jobId: string, wanted: QuestionInput[], actorId: string) {
    const existing = await this.repo.listQuestions(tx, jobId);
    const known = new Set(existing.map((question) => question.id));
    const seen = new Set<string>();
    for (const question of wanted) {
      if (!question.id) continue;
      if (!known.has(question.id))
        throw new ValidationError("A question does not belong to this job", { questions: question.id });
      if (seen.has(question.id)) throw new ValidationError("A question appears twice", { questions: question.id });
      seen.add(question.id);
    }

    await this.repo.archiveQuestions(
      tx,
      existing.filter((question) => !seen.has(question.id)).map((question) => question.id),
      actorId,
    );
    const added: { position: number; text: string; required: boolean }[] = [];
    for (const [position, question] of wanted.entries()) {
      const values = { position, text: question.text, required: question.required };
      if (question.id) await this.repo.updateQuestion(tx, question.id, values, actorId);
      else added.push(values);
    }
    await this.repo.insertQuestions(tx, jobId, added, actorId);
  }
}
