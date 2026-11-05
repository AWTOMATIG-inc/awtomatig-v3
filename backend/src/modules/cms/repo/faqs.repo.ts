import { Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, ilike, max, or, type SQL } from "drizzle-orm";

import { Database, type DbExecutor } from "../../../shared/db/database";
import { escapeLike } from "../domain/case-study";
import { type FaqSortField, type FaqStatus, MAX_PUBLISHED_FAQS } from "../domain/faq";
import { faqs } from "../schema";

const columns = {
  id: faqs.id,
  status: faqs.status,
  sortOrder: faqs.sortOrder,
  publishedAt: faqs.publishedAt,
  createdAt: faqs.createdAt,
  updatedAt: faqs.updatedAt,
  question: faqs.question,
  answer: faqs.answer,
};

export interface NewFaq {
  question: string;
  answer: string;
  sortOrder: number;
  createdBy: string;
}

export interface FaqPatch {
  question?: string;
  answer?: string;
  status?: FaqStatus;
  publishedAt?: Date | null;
}

export interface FaqFilter {
  status?: FaqStatus;
  q?: string;
  sort: FaqSortField;
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

/** The only place that reads or writes `cms.faqs`. */
@Injectable()
export class FaqsRepo {
  constructor(private readonly database: Database) {}

  async insert(executor: DbExecutor, values: NewFaq): Promise<{ id: string }> {
    const [inserted] = await executor
      .insert(faqs)
      .values({ ...values, updatedBy: values.createdBy })
      .returning({ id: faqs.id });
    return inserted!;
  }

  async list(filter: FaqFilter) {
    const conditions: SQL[] = [];
    if (filter.status) conditions.push(eq(faqs.status, filter.status));
    if (filter.q) {
      const term = `%${escapeLike(filter.q)}%`;
      const match = or(ilike(faqs.question, term), ilike(faqs.answer, term));
      if (match) conditions.push(match);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const column = { sortOrder: faqs.sortOrder, createdAt: faqs.createdAt, question: faqs.question }[filter.sort];
    const direction = filter.order === "asc" ? asc : desc;

    const db = this.database.db;
    const [items, totals] = await Promise.all([
      // `id` as a tie-breaker keeps pages stable when many rows share a value.
      db
        .select(columns)
        .from(faqs)
        .where(where)
        .orderBy(direction(column), desc(faqs.id))
        .limit(filter.limit)
        .offset(filter.offset),
      db.select({ total: count() }).from(faqs).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  /** Published FAQs in display order, capped, for the website. */
  async listPublished(executor: DbExecutor) {
    return executor
      .select({ question: faqs.question, answer: faqs.answer })
      .from(faqs)
      .where(eq(faqs.status, "published"))
      .orderBy(asc(faqs.sortOrder), asc(faqs.id))
      .limit(MAX_PUBLISHED_FAQS);
  }

  async countPublished(executor: DbExecutor): Promise<number> {
    const [row] = await executor.select({ total: count() }).from(faqs).where(eq(faqs.status, "published"));
    return row?.total ?? 0;
  }

  async findById(executor: DbExecutor, id: string) {
    const [row] = await executor.select(columns).from(faqs).where(eq(faqs.id, id));
    return row ?? null;
  }

  /** Locks the row until the transaction ends, so two employees cannot change the same FAQ's state at once. */
  async findForUpdate(executor: DbExecutor, id: string) {
    const [row] = await executor.select(columns).from(faqs).where(eq(faqs.id, id)).for("update");
    return row ?? null;
  }

  async update(executor: DbExecutor, id: string, patch: FaqPatch, actorId: string) {
    await executor
      .update(faqs)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(faqs.id, id));
  }

  async delete(executor: DbExecutor, id: string) {
    await executor.delete(faqs).where(eq(faqs.id, id));
  }

  /** The position a new FAQ takes: after every existing one. */
  async nextSortOrder(executor: DbExecutor): Promise<number> {
    const [row] = await executor.select({ highest: max(faqs.sortOrder) }).from(faqs);
    return (row?.highest ?? -1) + 1;
  }

  /** Every id, locked, in the current order. The caller compares it with the order it was sent. */
  async lockAllIds(executor: DbExecutor): Promise<string[]> {
    const rows = await executor.select({ id: faqs.id }).from(faqs).orderBy(asc(faqs.sortOrder), asc(faqs.id)).for("update");
    return rows.map((row) => row.id);
  }

  async setSortOrder(executor: DbExecutor, id: string, sortOrder: number, actorId: string) {
    await executor.update(faqs).set({ sortOrder, updatedBy: actorId }).where(eq(faqs.id, id));
  }
}
