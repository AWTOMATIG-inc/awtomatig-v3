import { Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, gte, ilike, inArray, lt, lte, or, type SQL, sql } from "drizzle-orm";

import { Database, type DbExecutor } from "../../../shared/db/database";
import type { ApplicationSortField, ApplicationStatus } from "../domain/application";
import { escapeLike } from "../domain/job";
import { applicationAnswers, applicationEducations, applicationExperiences, applications, jobs } from "../schema";

const listColumns = {
  id: applications.id,
  fullName: applications.fullName,
  email: applications.email,
  phone: applications.phone,
  status: applications.status,
  createdAt: applications.createdAt,
};

const detailColumns = {
  ...listColumns,
  jobId: applications.jobId,
  jobTitle: jobs.title,
  jobSlug: jobs.slug,
  githubUrl: applications.githubUrl,
  linkedinUrl: applications.linkedinUrl,
  resumeName: applications.resumeName,
  resumeSize: applications.resumeSize,
  notes: applications.notes,
  consentedAt: applications.consentedAt,
  updatedAt: applications.updatedAt,
};

export interface NewApplication {
  id: string;
  jobId: string;
  submissionId: string;
  fullName: string;
  email: string;
  phone: string;
  emailNormalized: string;
  phoneNormalized: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  resumeKey: string;
  resumeName: string;
  resumeSize: number;
  consentedAt: Date;
}

export interface NewEducation {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  completedOn: string | null;
  ongoing: boolean;
  grade: string | null;
}

export interface NewExperience {
  company: string;
  title: string;
  fromOn: string;
  toOn: string | null;
  current: boolean;
  responsibilities: string;
}

export interface NewAnswer {
  questionId: string;
  questionText: string;
  answer: string;
}

export interface ApplicationFilter {
  jobId: string;
  status?: ApplicationStatus;
  q?: string;
  sort: ApplicationSortField;
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

/** The only place that reads or writes the `recruitment.application*` tables. */
@Injectable()
export class ApplicationsRepo {
  constructor(private readonly database: Database) {}

  async findBySubmission(executor: DbExecutor, submissionId: string) {
    const [row] = await executor
      .select({ id: applications.id, jobId: applications.jobId })
      .from(applications)
      .where(eq(applications.submissionId, submissionId));
    return row ?? null;
  }

  /** True when this job already has an application with the same normalised email or phone. */
  async isDuplicate(executor: DbExecutor, jobId: string, emailNormalized: string, phoneNormalized: string): Promise<boolean> {
    const [row] = await executor
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.jobId, jobId),
          or(eq(applications.emailNormalized, emailNormalized), eq(applications.phoneNormalized, phoneNormalized)),
        ),
      )
      .limit(1);
    return row !== undefined;
  }

  /**
   * Stores the application and its child rows. Returns `false`, storing nothing, when a unique index already holds a row for
   * this submission, email or phone (a simultaneous double submit that passed the earlier checks).
   */
  async insert(
    executor: DbExecutor,
    application: NewApplication,
    educations: NewEducation[],
    experiences: NewExperience[],
    answers: NewAnswer[],
  ): Promise<boolean> {
    const [inserted] = await executor
      .insert(applications)
      .values(application)
      .onConflictDoNothing()
      .returning({ id: applications.id });
    if (!inserted) return false;

    const applicationId = application.id;
    if (educations.length > 0) {
      await executor
        .insert(applicationEducations)
        .values(educations.map((row, position) => ({ ...row, applicationId, position })));
    }
    if (experiences.length > 0) {
      await executor
        .insert(applicationExperiences)
        .values(experiences.map((row, position) => ({ ...row, applicationId, position })));
    }
    if (answers.length > 0) {
      await executor.insert(applicationAnswers).values(answers.map((row, position) => ({ ...row, applicationId, position })));
    }
    return true;
  }

  async list(filter: ApplicationFilter) {
    const conditions: SQL[] = [eq(applications.jobId, filter.jobId)];
    if (filter.status) conditions.push(eq(applications.status, filter.status));
    if (filter.q) {
      const pattern = `%${escapeLike(filter.q)}%`;
      const match = or(ilike(applications.fullName, pattern), ilike(applications.email, pattern));
      if (match) conditions.push(match);
    }
    const where = and(...conditions);

    const column = {
      createdAt: applications.createdAt,
      fullName: applications.fullName,
      status: applications.status,
    }[filter.sort];
    const direction = filter.order === "asc" ? asc : desc;

    const db = this.database.db;
    const [items, totals] = await Promise.all([
      // `id` as a tie-breaker keeps pages stable when many rows share a value.
      db
        .select(listColumns)
        .from(applications)
        .where(where)
        .orderBy(direction(column), desc(applications.id))
        .limit(filter.limit)
        .offset(filter.offset),
      db.select({ total: count() }).from(applications).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  async findDetail(executor: DbExecutor, id: string) {
    const [row] = await executor
      .select(detailColumns)
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(eq(applications.id, id));
    return row ?? null;
  }

  educations(executor: DbExecutor, applicationId: string) {
    return executor
      .select({
        degree: applicationEducations.degree,
        fieldOfStudy: applicationEducations.fieldOfStudy,
        institution: applicationEducations.institution,
        completedOn: applicationEducations.completedOn,
        ongoing: applicationEducations.ongoing,
        grade: applicationEducations.grade,
      })
      .from(applicationEducations)
      .where(eq(applicationEducations.applicationId, applicationId))
      .orderBy(asc(applicationEducations.position));
  }

  experiences(executor: DbExecutor, applicationId: string) {
    return executor
      .select({
        company: applicationExperiences.company,
        title: applicationExperiences.title,
        fromOn: applicationExperiences.fromOn,
        toOn: applicationExperiences.toOn,
        current: applicationExperiences.current,
        responsibilities: applicationExperiences.responsibilities,
      })
      .from(applicationExperiences)
      .where(eq(applicationExperiences.applicationId, applicationId))
      .orderBy(asc(applicationExperiences.position));
  }

  answers(executor: DbExecutor, applicationId: string) {
    return executor
      .select({
        questionId: applicationAnswers.questionId,
        question: applicationAnswers.questionText,
        answer: applicationAnswers.answer,
      })
      .from(applicationAnswers)
      .where(eq(applicationAnswers.applicationId, applicationId))
      .orderBy(asc(applicationAnswers.position));
  }

  async update(
    executor: DbExecutor,
    id: string,
    patch: { status?: ApplicationStatus; notes?: string | null },
    actorId: string,
  ): Promise<boolean> {
    const updated = await executor
      .update(applications)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(applications.id, id))
      .returning({ id: applications.id });
    return updated.length > 0;
  }

  async findResume(executor: DbExecutor, id: string) {
    const [row] = await executor
      .select({ jobId: applications.jobId, resumeKey: applications.resumeKey })
      .from(applications)
      .where(eq(applications.id, id));
    return row ?? null;
  }

  /**
   * The figures for the admin dashboard. `today` and `closingBy` are Dhaka calendar dates (`YYYY-MM-DD`); an application is
   * stale when it is still `new` and was received before `staleBefore`. The stale list is the oldest six.
   */
  async dashboardStats(today: string, closingBy: string, staleBefore: Date) {
    const db = this.database.db;
    const open = and(eq(jobs.status, "open"), gte(jobs.deadlineOn, today));
    const stale = and(eq(applications.status, "new"), lt(applications.createdAt, staleBefore));

    const [openJobs, closingSoon, newApplications, staleCount, staleRows] = await Promise.all([
      db.select({ n: count() }).from(jobs).where(open),
      db
        .select({ n: count() })
        .from(jobs)
        .where(and(open, lte(jobs.deadlineOn, closingBy))),
      db.select({ n: count() }).from(applications).where(eq(applications.status, "new")),
      db.select({ n: count() }).from(applications).where(stale),
      db
        .select({
          id: applications.id,
          fullName: applications.fullName,
          jobId: applications.jobId,
          jobTitle: jobs.title,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .innerJoin(jobs, eq(jobs.id, applications.jobId))
        .where(stale)
        .orderBy(asc(applications.createdAt), asc(applications.id))
        .limit(6),
    ]);
    return {
      openJobs: openJobs[0]?.n ?? 0,
      closingSoon: closingSoon[0]?.n ?? 0,
      newApplications: newApplications[0]?.n ?? 0,
      staleCount: staleCount[0]?.n ?? 0,
      stale: staleRows,
    };
  }

  /** How many applications each job has, and how many nobody has looked at yet. Jobs with none are missing from the map. */
  async countByJobs(executor: DbExecutor, jobIds: string[]): Promise<Map<string, { total: number; fresh: number }>> {
    if (jobIds.length === 0) return new Map();
    const rows = await executor
      .select({
        jobId: applications.jobId,
        total: count(),
        fresh: sql<number>`count(*) filter (where ${applications.status} = 'new')`.mapWith(Number),
      })
      .from(applications)
      .where(inArray(applications.jobId, jobIds))
      .groupBy(applications.jobId);
    return new Map(rows.map((row) => [row.jobId, { total: row.total, fresh: row.fresh }]));
  }
}
