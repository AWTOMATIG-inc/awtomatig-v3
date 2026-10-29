import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { captureLeadSchema, LEAD_STATUSES, leadStatsQuerySchema, listLeadsQuerySchema, updateLeadSchema } from "../domain/lead";

const iso = z.iso.datetime();

const leadSummary = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  company: z.string(),
  budget: z.string(),
  helpWith: z.string(),
  projectType: z.string(),
  source: z.string(),
  status: z.enum(LEAD_STATUSES),
  createdAt: iso,
});

const leadDetail = leadSummary.extend({
  message: z.string(),
  /** Empty when there are no notes. */
  notes: z.string(),
  consentAt: iso,
  updatedAt: iso,
});

export class CaptureLeadDto extends createZodDto(captureLeadSchema) {}
export class CapturedLeadDto extends createZodDto(z.object({ id: z.uuid() })) {}

export class ListLeadsQueryDto extends createZodDto(listLeadsQuerySchema) {}
export class LeadListDto extends createZodDto(
  z.object({ items: z.array(leadSummary), total: z.number().int(), page: z.number().int(), pageSize: z.number().int() }),
) {}

export class LeadIdParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
export class LeadDto extends createZodDto(leadDetail) {}
export class UpdateLeadDto extends createZodDto(updateLeadSchema) {}

export class LeadStatsQueryDto extends createZodDto(leadStatsQuerySchema) {}
export class LeadStatsDto extends createZodDto(
  z.object({
    days: z.number().int(),
    /** Whether each point in `series` is a day or a week. */
    bucket: z.enum(["day", "week"]),
    /** Leads nobody has touched yet (status `new`). */
    needsReply: z.number().int(),
    /** Leads still being worked on: new, contacted or qualified. */
    open: z.number().int(),
    /** Leads received in the last `days` days, and in the same number of days before that. */
    inRange: z.number().int(),
    previousRange: z.number().int(),
    staleAfterDays: z.number().int(),
    staleCount: z.number().int(),
    /** The oldest untouched leads, up to six. */
    stale: z.array(z.object({ id: z.uuid(), name: z.string(), company: z.string(), createdAt: iso })),
    /** One point per bucket, oldest first; `start` is a local date, `YYYY-MM-DD`. */
    series: z.array(z.object({ start: z.string(), count: z.number().int() })),
    activity: z.array(z.object({ id: z.uuid(), at: iso, actor: z.string(), action: z.string() })),
  }),
) {}
