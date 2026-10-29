import { Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, gte, ilike, inArray, lt, or, sql, type SQL } from "drizzle-orm";

import { auditLog } from "../../../shared/audit/audit.schema";
import { users } from "../../../shared/auth/auth.schema";
import { Database, type DbExecutor } from "../../../shared/db/database";
import { escapeLike, type LeadSortField, type LeadStatus, OPEN_LEAD_STATUSES, STALE_AFTER_DAYS } from "../domain/lead";
import { leads } from "../schema";

const summaryColumns = {
  id: leads.id,
  name: leads.name,
  email: leads.email,
  company: leads.company,
  budget: leads.budget,
  helpWith: leads.helpWith,
  projectType: leads.projectType,
  source: leads.source,
  status: leads.status,
  createdAt: leads.createdAt,
};

const detailColumns = {
  ...summaryColumns,
  message: leads.message,
  notes: leads.notes,
  consentAt: leads.consentAt,
  updatedAt: leads.updatedAt,
};

export interface NewLead {
  submissionId: string;
  name: string;
  email: string;
  company: string;
  budget: string;
  helpWith: string;
  projectType: string;
  message: string;
  source: string;
  consentAt: Date;
}

export interface LeadFilter {
  status?: LeadStatus;
  q?: string;
  sort: LeadSortField;
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface StatsWindow {
  days: number;
  timeZone: string;
  unit: "day" | "week";
  buckets: number;
}

/** The only place that reads or writes `crm.leads`. */
@Injectable()
export class LeadsRepo {
  constructor(private readonly database: Database) {}

  /** Inserts the lead, or returns the one already stored for this submission id. */
  async insertIfNew(executor: DbExecutor, values: NewLead): Promise<{ id: string; created: boolean }> {
    const [inserted] = await executor.insert(leads).values(values).onConflictDoNothing().returning({ id: leads.id });
    if (inserted) return { id: inserted.id, created: true };
    const [existing] = await executor.select({ id: leads.id }).from(leads).where(eq(leads.submissionId, values.submissionId));
    if (!existing) throw new Error("Lead insert conflicted but no row was found");
    return { id: existing.id, created: false };
  }

  async list(filter: LeadFilter) {
    const conditions: SQL[] = [];
    if (filter.status) conditions.push(eq(leads.status, filter.status));
    if (filter.q) {
      const pattern = `%${escapeLike(filter.q)}%`;
      const match = or(ilike(leads.name, pattern), ilike(leads.email, pattern), ilike(leads.company, pattern));
      if (match) conditions.push(match);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const column = { createdAt: leads.createdAt, name: leads.name, status: leads.status }[filter.sort];
    const direction = filter.order === "asc" ? asc : desc;

    const db = this.database.db;
    const [items, totals] = await Promise.all([
      // `id` as a tie-breaker keeps pages stable when many rows share a value.
      db
        .select(summaryColumns)
        .from(leads)
        .where(where)
        .orderBy(direction(column), desc(leads.id))
        .limit(filter.limit)
        .offset(filter.offset),
      db.select({ total: count() }).from(leads).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  async findById(id: string) {
    const [row] = await this.database.db.select(detailColumns).from(leads).where(eq(leads.id, id));
    return row ?? null;
  }

  async update(executor: DbExecutor, id: string, patch: { status?: LeadStatus; notes?: string | null }, actorId: string) {
    const [row] = await executor
      .update(leads)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(leads.id, id))
      .returning(detailColumns);
    return row ?? null;
  }

  async stats(window: StatsWindow) {
    const db = this.database.db;
    const now = sql`now()`;
    const rangeStart = sql`${now} - make_interval(days => ${window.days})`;
    const previousStart = sql`${now} - make_interval(days => ${window.days * 2})`;
    const staleBefore = sql`${now} - make_interval(days => ${STALE_AFTER_DAYS})`;

    const countWhere = (condition: SQL | undefined) => db.select({ total: count() }).from(leads).where(condition);

    // Buckets are cut in the dashboard's own time zone, so "today" matches what the team sees on the clock.
    // Both come from a closed set ("day" | "week"), never from the request, so inlining them is safe.
    const unit = sql.raw(`'${window.unit}'`);
    const step = sql.raw(window.unit === "day" ? "days" : "weeks");
    const localNow = sql`(now() AT TIME ZONE ${window.timeZone})`;
    const series = db.execute<{ start: string; total: number }>(sql`
      select to_char(b.start, 'YYYY-MM-DD') as start, count(l.id)::int as total
      from generate_series(
        date_trunc(${unit}, ${localNow}) - make_interval(${step} => ${window.buckets - 1}),
        date_trunc(${unit}, ${localNow}),
        make_interval(${step} => 1)
      ) as b(start)
      left join ${leads} l
        on date_trunc(${unit}, l.created_at at time zone ${window.timeZone}) = b.start
      group by b.start
      order by b.start
    `);

    const [needsReply, open, inRange, previousRange, staleCount, stale, activity, seriesResult] = await Promise.all([
      countWhere(eq(leads.status, "new")),
      countWhere(inArray(leads.status, [...OPEN_LEAD_STATUSES])),
      countWhere(gte(leads.createdAt, rangeStart)),
      countWhere(and(gte(leads.createdAt, previousStart), lt(leads.createdAt, rangeStart))),
      countWhere(and(eq(leads.status, "new"), lt(leads.createdAt, staleBefore))),
      db
        .select({ id: leads.id, name: leads.name, company: leads.company, createdAt: leads.createdAt })
        .from(leads)
        .where(and(eq(leads.status, "new"), lt(leads.createdAt, staleBefore)))
        .orderBy(asc(leads.createdAt))
        .limit(6),
      db
        .select({
          id: auditLog.id,
          at: auditLog.occurredAt,
          action: auditLog.action,
          metadata: auditLog.metadata,
          actorName: users.name,
          leadName: leads.name,
        })
        .from(auditLog)
        .leftJoin(users, eq(users.id, auditLog.actorId))
        .leftJoin(leads, sql`${leads.id}::text = ${auditLog.entityId}`)
        .where(inArray(auditLog.action, ["crm.lead.captured", "crm.lead.updated"]))
        .orderBy(desc(auditLog.occurredAt))
        .limit(8),
      series,
    ]);

    return {
      needsReply: needsReply[0]?.total ?? 0,
      open: open[0]?.total ?? 0,
      inRange: inRange[0]?.total ?? 0,
      previousRange: previousRange[0]?.total ?? 0,
      staleCount: staleCount[0]?.total ?? 0,
      stale,
      activity,
      series: seriesResult.rows,
    };
  }
}
