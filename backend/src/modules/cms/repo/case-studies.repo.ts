import { Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, ilike, isNotNull, max, or, type SQL } from "drizzle-orm";

import { Database, type DbExecutor } from "../../../shared/db/database";
import { type CaseStudySortField, type CaseStudyStat, type CaseStudyStatus, escapeLike } from "../domain/case-study";
import { caseStudies } from "../schema";

const summaryColumns = {
  id: caseStudies.id,
  slug: caseStudies.slug,
  title: caseStudies.title,
  client: caseStudies.client,
  service: caseStudies.service,
  category: caseStudies.category,
  status: caseStudies.status,
  sortOrder: caseStudies.sortOrder,
  publishedAt: caseStudies.publishedAt,
  createdAt: caseStudies.createdAt,
  imageKey: caseStudies.imageKey,
  imageAlt: caseStudies.imageAlt,
  imageWidth: caseStudies.imageWidth,
  imageHeight: caseStudies.imageHeight,
};

const detailColumns = {
  ...summaryColumns,
  summary: caseStudies.summary,
  description: caseStudies.description,
  challenge: caseStudies.challenge,
  tags: caseStudies.tags,
  stats: caseStudies.stats,
  seoTitle: caseStudies.seoTitle,
  seoDescription: caseStudies.seoDescription,
  imageSize: caseStudies.imageSize,
  imageType: caseStudies.imageType,
  updatedAt: caseStudies.updatedAt,
};

export interface NewCaseStudy {
  slug: string;
  title: string;
  summary: string;
  client: string;
  service: string;
  category: string;
  description: string;
  challenge: string;
  tags: string[];
  stats: CaseStudyStat[];
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  createdBy: string;
}

export interface CaseStudyPatch {
  title?: string;
  summary?: string;
  client?: string;
  service?: string;
  category?: string;
  description?: string;
  challenge?: string;
  tags?: string[];
  stats?: CaseStudyStat[];
  seoTitle?: string;
  seoDescription?: string;
  status?: CaseStudyStatus;
  publishedAt?: Date | null;
  imageKey?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageSize?: number;
  imageType?: string;
}

export interface CaseStudyFilter {
  status?: CaseStudyStatus;
  q?: string;
  sort: CaseStudySortField;
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

/** The only place that reads or writes `cms.case_studies`. */
@Injectable()
export class CaseStudiesRepo {
  constructor(private readonly database: Database) {}

  /** Inserts the study, or returns `null` when the slug is already taken. */
  async insert(executor: DbExecutor, values: NewCaseStudy): Promise<{ id: string } | null> {
    const [inserted] = await executor
      .insert(caseStudies)
      .values({ ...values, updatedBy: values.createdBy })
      .onConflictDoNothing({ target: caseStudies.slug })
      .returning({ id: caseStudies.id });
    return inserted ?? null;
  }

  async list(filter: CaseStudyFilter) {
    const conditions: SQL[] = [];
    if (filter.status) conditions.push(eq(caseStudies.status, filter.status));
    if (filter.q) {
      const term = `%${escapeLike(filter.q)}%`;
      const match = or(ilike(caseStudies.title, term), ilike(caseStudies.client, term));
      if (match) conditions.push(match);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const column = { sortOrder: caseStudies.sortOrder, createdAt: caseStudies.createdAt, title: caseStudies.title }[filter.sort];
    const direction = filter.order === "asc" ? asc : desc;

    const db = this.database.db;
    const [items, totals] = await Promise.all([
      // `id` as a tie-breaker keeps pages stable when many rows share a value.
      db
        .select(summaryColumns)
        .from(caseStudies)
        .where(where)
        .orderBy(direction(column), desc(caseStudies.id))
        .limit(filter.limit)
        .offset(filter.offset),
      db.select({ total: count() }).from(caseStudies).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  async findById(executor: DbExecutor, id: string) {
    const [row] = await executor.select(detailColumns).from(caseStudies).where(eq(caseStudies.id, id));
    return row ?? null;
  }

  /** Locks the row until the transaction ends, so two employees cannot change the same study's state at once. */
  async findForUpdate(executor: DbExecutor, id: string) {
    const [row] = await executor.select(detailColumns).from(caseStudies).where(eq(caseStudies.id, id)).for("update");
    return row ?? null;
  }

  /** Published studies in display order, with the whole record. At most 100, so it can never be unbounded. */
  listPublished(executor: DbExecutor) {
    return executor
      .select(detailColumns)
      .from(caseStudies)
      .where(and(eq(caseStudies.status, "published"), isNotNull(caseStudies.imageKey)))
      .orderBy(asc(caseStudies.sortOrder), asc(caseStudies.id))
      .limit(100);
  }

  /** A published study by its slug. A draft is never returned. */
  async findPublishedBySlug(executor: DbExecutor, slug: string) {
    const [row] = await executor
      .select(detailColumns)
      .from(caseStudies)
      .where(and(eq(caseStudies.slug, slug), eq(caseStudies.status, "published"), isNotNull(caseStudies.imageKey)));
    return row ?? null;
  }

  async update(executor: DbExecutor, id: string, patch: CaseStudyPatch, actorId: string) {
    await executor
      .update(caseStudies)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(caseStudies.id, id));
  }

  async delete(executor: DbExecutor, id: string) {
    await executor.delete(caseStudies).where(eq(caseStudies.id, id));
  }

  /** The position a new study takes: after every existing one. */
  async nextSortOrder(executor: DbExecutor): Promise<number> {
    const [row] = await executor.select({ highest: max(caseStudies.sortOrder) }).from(caseStudies);
    return (row?.highest ?? -1) + 1;
  }

  /** Every id, locked, in the current order. The caller compares it with the order it was sent. */
  async lockAllIds(executor: DbExecutor): Promise<string[]> {
    const rows = await executor
      .select({ id: caseStudies.id })
      .from(caseStudies)
      .orderBy(asc(caseStudies.sortOrder), asc(caseStudies.id))
      .for("update");
    return rows.map((row) => row.id);
  }

  async setSortOrder(executor: DbExecutor, id: string, sortOrder: number, actorId: string) {
    await executor.update(caseStudies).set({ sortOrder, updatedBy: actorId }).where(eq(caseStudies.id, id));
  }
}
