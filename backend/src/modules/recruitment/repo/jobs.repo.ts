import { Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, type SQL } from "drizzle-orm";

import { Database, type DbExecutor } from "../../../shared/db/database";
import { escapeLike, type JobSortField, type JobStatus } from "../domain/job";
import { jobQuestions, jobs } from "../schema";

const summaryColumns = {
  id: jobs.id,
  slug: jobs.slug,
  title: jobs.title,
  jobType: jobs.jobType,
  workMode: jobs.workMode,
  vacancies: jobs.vacancies,
  location: jobs.location,
  deadlineOn: jobs.deadlineOn,
  status: jobs.status,
  publishedAt: jobs.publishedAt,
  createdAt: jobs.createdAt,
};

const detailColumns = {
  ...summaryColumns,
  salaryMin: jobs.salaryMin,
  salaryMax: jobs.salaryMax,
  salaryCurrency: jobs.salaryCurrency,
  officeTiming: jobs.officeTiming,
  description: jobs.description,
  requirements: jobs.requirements,
  benefits: jobs.benefits,
  closedAt: jobs.closedAt,
  updatedAt: jobs.updatedAt,
};

const questionColumns = {
  id: jobQuestions.id,
  position: jobQuestions.position,
  text: jobQuestions.text,
  required: jobQuestions.required,
};

export interface NewJob {
  slug: string;
  title: string;
  jobType: string;
  workMode: string;
  salaryMin: string | null;
  salaryMax: string | null;
  vacancies: number;
  officeTiming: string;
  location: string;
  description: string;
  requirements: string;
  benefits: string;
  deadlineOn: string;
  status: JobStatus;
  publishedAt: Date | null;
  createdBy: string;
}

export interface JobPatch {
  title?: string;
  jobType?: string;
  workMode?: string;
  salaryMin?: string | null;
  salaryMax?: string | null;
  vacancies?: number;
  officeTiming?: string;
  location?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  deadlineOn?: string;
  status?: JobStatus;
  publishedAt?: Date | null;
  closedAt?: Date | null;
}

export interface JobFilter {
  status?: JobStatus;
  q?: string;
  sort: JobSortField;
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

/** The only place that reads or writes `recruitment.jobs` and `recruitment.job_questions`. */
@Injectable()
export class JobsRepo {
  constructor(private readonly database: Database) {}

  /** Inserts the job, or returns `null` when the slug is already taken so the caller can try another suffix. */
  async insertJob(executor: DbExecutor, values: NewJob): Promise<{ id: string } | null> {
    const [inserted] = await executor
      .insert(jobs)
      .values({ ...values, updatedBy: values.createdBy })
      .onConflictDoNothing({ target: jobs.slug })
      .returning({ id: jobs.id });
    return inserted ?? null;
  }

  async list(filter: JobFilter) {
    const conditions: SQL[] = [];
    if (filter.status) conditions.push(eq(jobs.status, filter.status));
    if (filter.q) conditions.push(ilike(jobs.title, `%${escapeLike(filter.q)}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const column = { createdAt: jobs.createdAt, deadlineOn: jobs.deadlineOn, title: jobs.title }[filter.sort];
    const direction = filter.order === "asc" ? asc : desc;

    const db = this.database.db;
    const [items, totals] = await Promise.all([
      // `id` as a tie-breaker keeps pages stable when many rows share a value.
      db
        .select(summaryColumns)
        .from(jobs)
        .where(where)
        .orderBy(direction(column), desc(jobs.id))
        .limit(filter.limit)
        .offset(filter.offset),
      db.select({ total: count() }).from(jobs).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  async findById(executor: DbExecutor, id: string) {
    const [row] = await executor.select(detailColumns).from(jobs).where(eq(jobs.id, id));
    return row ?? null;
  }

  async findBySlug(executor: DbExecutor, slug: string) {
    const [row] = await executor.select(detailColumns).from(jobs).where(eq(jobs.slug, slug));
    return row ?? null;
  }

  /** Open jobs whose last day (a `YYYY-MM-DD` date) is `today` or later, soonest deadline first. At most 100, so it can never be unbounded. */
  listOpen(executor: DbExecutor, today: string) {
    return executor
      .select({ ...summaryColumns, salaryMin: jobs.salaryMin, salaryMax: jobs.salaryMax, officeTiming: jobs.officeTiming })
      .from(jobs)
      .where(and(eq(jobs.status, "open"), gte(jobs.deadlineOn, today)))
      .orderBy(asc(jobs.deadlineOn), desc(jobs.publishedAt), desc(jobs.id))
      .limit(100);
  }

  /** Locks the row until the transaction ends, so two employees cannot change the same job's state at once. */
  async findForUpdate(executor: DbExecutor, id: string) {
    const [row] = await executor.select(detailColumns).from(jobs).where(eq(jobs.id, id)).for("update");
    return row ?? null;
  }

  async update(executor: DbExecutor, id: string, patch: JobPatch, actorId: string) {
    await executor
      .update(jobs)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(jobs.id, id));
  }

  /** Active questions in display order. */
  listQuestions(executor: DbExecutor, jobId: string) {
    return executor
      .select(questionColumns)
      .from(jobQuestions)
      .where(and(eq(jobQuestions.jobId, jobId), isNull(jobQuestions.archivedAt)))
      .orderBy(asc(jobQuestions.position), asc(jobQuestions.id));
  }

  async insertQuestions(
    executor: DbExecutor,
    jobId: string,
    rows: { position: number; text: string; required: boolean }[],
    actorId: string,
  ) {
    if (rows.length === 0) return;
    await executor.insert(jobQuestions).values(rows.map((row) => ({ ...row, jobId, createdBy: actorId, updatedBy: actorId })));
  }

  async updateQuestion(
    executor: DbExecutor,
    id: string,
    patch: { position: number; text: string; required: boolean },
    actorId: string,
  ) {
    await executor
      .update(jobQuestions)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(jobQuestions.id, id));
  }

  async archiveQuestions(executor: DbExecutor, ids: string[], actorId: string) {
    if (ids.length === 0) return;
    await executor.update(jobQuestions).set({ archivedAt: new Date(), updatedBy: actorId }).where(inArray(jobQuestions.id, ids));
  }
}
