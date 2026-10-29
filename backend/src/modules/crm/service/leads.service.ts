import { Injectable } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { Database } from "../../../shared/db/database";
import { NotFoundError } from "../../../shared/errors/app-error";
import {
  type CaptureLeadInput,
  type LeadStatsQuery,
  type LeadStatus,
  type ListLeadsQuery,
  statsBucket,
  STALE_AFTER_DAYS,
  type UpdateLeadInput,
} from "../domain/lead";
import { LeadsRepo } from "../repo/leads.repo";

interface LeadSummaryRow {
  id: string;
  name: string;
  email: string;
  company: string;
  budget: string;
  helpWith: string;
  projectType: string;
  source: string;
  status: string;
  createdAt: Date;
}

interface LeadDetailRow extends LeadSummaryRow {
  message: string;
  notes: string | null;
  consentAt: Date;
  updatedAt: Date;
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

const summary = (row: LeadSummaryRow) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  company: row.company,
  budget: row.budget,
  helpWith: row.helpWith,
  projectType: row.projectType,
  source: row.source,
  status: row.status as LeadStatus,
  createdAt: row.createdAt.toISOString(),
});

const detail = (row: LeadDetailRow) => ({
  ...summary(row),
  message: row.message,
  notes: row.notes ?? "",
  consentAt: row.consentAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/** Use cases for website inquiries. Permissions are declared on the endpoints (`crm.lead.read` / `crm.lead.update`). */
@Injectable()
export class LeadsService {
  constructor(
    private readonly database: Database,
    private readonly repo: LeadsRepo,
    private readonly audit: AuditService,
  ) {}

  /** Stores an inquiry from the website. Sending the same submission again returns the lead that is already stored. */
  async capture(input: CaptureLeadInput): Promise<{ id: string }> {
    return this.database.transaction(async (tx) => {
      const { id, created } = await this.repo.insertIfNew(tx, {
        submissionId: input.submissionId,
        name: input.name,
        email: input.email,
        company: input.company,
        budget: input.budget,
        helpWith: input.helpWith,
        projectType: input.projectType,
        message: input.message,
        source: input.source,
        consentAt: new Date(),
      });
      // No personal data in the audit log: the lead id is enough to find the record.
      if (created) {
        await this.audit.record(
          { action: "crm.lead.captured", entityType: "lead", entityId: id, metadata: { source: input.source } },
          tx,
        );
      }
      return { id };
    });
  }

  async list(query: ListLeadsQuery) {
    const { items, total } = await this.repo.list({
      status: query.status,
      q: query.q || undefined,
      sort: query.sort,
      order: query.order,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return { items: items.map(summary), total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError("Lead not found");
    return detail(row);
  }

  async update(id: string, input: UpdateLeadInput, actorId: string) {
    return this.database.transaction(async (tx) => {
      const patch: { status?: LeadStatus; notes?: string | null } = {};
      if (input.status !== undefined) patch.status = input.status;
      // An empty note clears it.
      if (input.notes !== undefined) patch.notes = input.notes ? input.notes : null;

      const row = await this.repo.update(tx, id, patch, actorId);
      if (!row) throw new NotFoundError("Lead not found");

      const fields = Object.keys(patch);
      await this.audit.record(
        {
          action: "crm.lead.updated",
          actorId,
          entityType: "lead",
          entityId: id,
          metadata: { fields, ...(patch.status ? { status: patch.status } : {}) },
        },
        tx,
      );
      return detail(row);
    });
  }

  /** The figures behind the dashboard: counts, a bar chart series, leads waiting too long, and recent activity. */
  async stats(query: LeadStatsQuery) {
    const { unit, count } = statsBucket(query.days);
    const result = await this.repo.stats({ days: query.days, timeZone: query.timeZone, unit, buckets: count });
    return {
      days: query.days,
      bucket: unit,
      needsReply: result.needsReply,
      open: result.open,
      inRange: result.inRange,
      previousRange: result.previousRange,
      staleAfterDays: STALE_AFTER_DAYS,
      staleCount: result.staleCount,
      stale: result.stale.map((row) => ({
        id: row.id,
        name: row.name,
        company: row.company,
        createdAt: row.createdAt.toISOString(),
      })),
      series: result.series.map((point) => ({ start: point.start, count: point.total })),
      activity: result.activity.map((row) => ({
        id: row.id,
        at: row.at.toISOString(),
        actor: row.actorName ?? "Website",
        action: describe(row.action, row.leadName, row.metadata),
      })),
    };
  }
}

function describe(action: string, leadName: string | null, metadata: Record<string, unknown> | null): string {
  const who = leadName ?? "a lead";
  if (action === "crm.lead.captured") return `Inquiry received from ${who}`;
  const status = typeof metadata?.status === "string" ? STATUS_LABEL[metadata.status as LeadStatus] : undefined;
  const fields = Array.isArray(metadata?.fields) ? (metadata.fields as unknown[]) : [];
  if (status) return `Marked ${who} as ${status}`;
  if (fields.includes("notes")) return `Updated the notes on ${who}`;
  return `Updated ${who}`;
}
