import { Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, ilike, max, or, type SQL } from "drizzle-orm";

import { Database, type DbExecutor } from "../../../shared/db/database";
import { escapeLike } from "../domain/case-study";
import type { TestimonialSortField, TestimonialStatus } from "../domain/testimonial";
import { testimonials } from "../schema";

const columns = {
  id: testimonials.id,
  status: testimonials.status,
  sortOrder: testimonials.sortOrder,
  publishedAt: testimonials.publishedAt,
  createdAt: testimonials.createdAt,
  updatedAt: testimonials.updatedAt,
  quote: testimonials.quote,
  name: testimonials.name,
  role: testimonials.role,
  company: testimonials.company,
  service: testimonials.service,
  consentConfirmed: testimonials.consentConfirmed,
  logoInBlack: testimonials.logoInBlack,
  logoKey: testimonials.logoKey,
  logoWidth: testimonials.logoWidth,
  logoHeight: testimonials.logoHeight,
  logoSize: testimonials.logoSize,
  logoType: testimonials.logoType,
};

export interface NewTestimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  service: string;
  consentConfirmed: boolean;
  logoInBlack: boolean;
  sortOrder: number;
  createdBy: string;
}

export interface TestimonialPatch {
  quote?: string;
  name?: string;
  role?: string;
  company?: string;
  service?: string;
  consentConfirmed?: boolean;
  logoInBlack?: boolean;
  status?: TestimonialStatus;
  publishedAt?: Date | null;
  logoKey?: string | null;
  logoWidth?: number | null;
  logoHeight?: number | null;
  logoSize?: number | null;
  logoType?: string | null;
}

/** How many testimonials the public list returns at most. */
export const PUBLIC_TESTIMONIAL_LIMIT = 50;

export interface TestimonialFilter {
  status?: TestimonialStatus;
  q?: string;
  sort: TestimonialSortField;
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

/** The only place that reads or writes `cms.testimonials`. */
@Injectable()
export class TestimonialsRepo {
  constructor(private readonly database: Database) {}

  async insert(executor: DbExecutor, values: NewTestimonial): Promise<{ id: string }> {
    const [inserted] = await executor
      .insert(testimonials)
      .values({ ...values, updatedBy: values.createdBy })
      .returning({ id: testimonials.id });
    return inserted!;
  }

  async list(filter: TestimonialFilter) {
    const conditions: SQL[] = [];
    if (filter.status) conditions.push(eq(testimonials.status, filter.status));
    if (filter.q) {
      const term = `%${escapeLike(filter.q)}%`;
      const match = or(ilike(testimonials.name, term), ilike(testimonials.company, term), ilike(testimonials.quote, term));
      if (match) conditions.push(match);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const column = {
      sortOrder: testimonials.sortOrder,
      createdAt: testimonials.createdAt,
      name: testimonials.name,
      company: testimonials.company,
    }[filter.sort];
    const direction = filter.order === "asc" ? asc : desc;

    const db = this.database.db;
    const [items, totals] = await Promise.all([
      // `id` as a tie-breaker keeps pages stable when many rows share a value.
      db
        .select(columns)
        .from(testimonials)
        .where(where)
        .orderBy(direction(column), desc(testimonials.id))
        .limit(filter.limit)
        .offset(filter.offset),
      db.select({ total: count() }).from(testimonials).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  /** Published testimonials in display order, capped, for the website. */
  async listPublished(executor: DbExecutor) {
    return executor
      .select(columns)
      .from(testimonials)
      .where(eq(testimonials.status, "published"))
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.id))
      .limit(PUBLIC_TESTIMONIAL_LIMIT);
  }

  async findById(executor: DbExecutor, id: string) {
    const [row] = await executor.select(columns).from(testimonials).where(eq(testimonials.id, id));
    return row ?? null;
  }

  /** Locks the row until the transaction ends, so two employees cannot change the same testimonial's state at once. */
  async findForUpdate(executor: DbExecutor, id: string) {
    const [row] = await executor.select(columns).from(testimonials).where(eq(testimonials.id, id)).for("update");
    return row ?? null;
  }

  async update(executor: DbExecutor, id: string, patch: TestimonialPatch, actorId: string) {
    await executor
      .update(testimonials)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(testimonials.id, id));
  }

  async delete(executor: DbExecutor, id: string) {
    await executor.delete(testimonials).where(eq(testimonials.id, id));
  }

  /** The position a new testimonial takes: after every existing one. */
  async nextSortOrder(executor: DbExecutor): Promise<number> {
    const [row] = await executor.select({ highest: max(testimonials.sortOrder) }).from(testimonials);
    return (row?.highest ?? -1) + 1;
  }

  /** Every id, locked, in the current order. The caller compares it with the order it was sent. */
  async lockAllIds(executor: DbExecutor): Promise<string[]> {
    const rows = await executor
      .select({ id: testimonials.id })
      .from(testimonials)
      .orderBy(asc(testimonials.sortOrder), asc(testimonials.id))
      .for("update");
    return rows.map((row) => row.id);
  }

  async setSortOrder(executor: DbExecutor, id: string, sortOrder: number, actorId: string) {
    await executor.update(testimonials).set({ sortOrder, updatedBy: actorId }).where(eq(testimonials.id, id));
  }
}
