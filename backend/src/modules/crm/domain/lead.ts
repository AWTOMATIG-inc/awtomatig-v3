import { z } from "zod";

/** Where a lead is in the pipeline. `new` means nobody has looked at it yet. */
export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Leads still being worked on. `won` and `lost` are closed. */
export const OPEN_LEAD_STATUSES: readonly LeadStatus[] = ["new", "contacted", "qualified"];

/** A new lead nobody has touched for this long shows up under "Needs attention" on the dashboard. */
export const STALE_AFTER_DAYS = 2;

export const LEAD_SORT_FIELDS = ["createdAt", "name", "status"] as const;
export type LeadSortField = (typeof LEAD_SORT_FIELDS)[number];

/** What the public website form sends. The website validates the same limits; the backend never trusts that. */
export const captureLeadSchema = z.object({
  /** One id per form submission. A retry with the same id returns the stored lead instead of adding a second one. */
  submissionId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  email: z
    .email()
    .max(200)
    .transform((value) => value.toLowerCase()),
  company: z.string().trim().max(160).default(""),
  budget: z.string().trim().max(60).default(""),
  helpWith: z.string().trim().min(1).max(120),
  projectType: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(5000),
  /** The visitor ticked the consent box. Anything else is rejected. */
  consent: z.literal(true),
  source: z.string().trim().min(1).max(40).default("website-contact"),
});
export type CaptureLeadInput = z.infer<typeof captureLeadSchema>;

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(LEAD_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(LEAD_SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

export const updateLeadSchema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    /** Internal notes. `null` or an empty string clears them. */
    notes: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((value) => value.status !== undefined || value.notes !== undefined, { message: "Send a status or notes to change" });
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

/** An IANA time zone name such as `Asia/Dhaka`, used to decide where one day or week ends in the dashboard figures. */
export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const leadStatsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  timeZone: z.string().max(64).refine(isTimeZone, { message: "Not a time zone name" }).default("UTC"),
});
export type LeadStatsQuery = z.infer<typeof leadStatsQuerySchema>;

/** One bar per day for a week or less, one bar per week beyond that. */
export function statsBucket(days: number): { unit: "day" | "week"; count: number } {
  return days <= 7 ? { unit: "day", count: days } : { unit: "week", count: Math.ceil(days / 7) };
}

/** Escapes `%`, `_` and `\` so a search term is matched literally by `ILIKE`. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
