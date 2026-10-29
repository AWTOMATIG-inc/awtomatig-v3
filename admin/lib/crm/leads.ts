import type { StatusTone } from "@/components/ui";
import type { components } from "@/lib/api/schema";

export type LeadStatus = components["schemas"]["LeadDto"]["status"];
export type LeadSort = "createdAt" | "name" | "status";
export type LeadOrder = "asc" | "desc";

export const LEAD_STATUSES: readonly LeadStatus[] = ["new", "contacted", "qualified", "won", "lost"];
export const LEAD_SORTS: readonly LeadSort[] = ["createdAt", "name", "status"];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

/** Only a lead nobody has looked at yet gets a dot (DESIGN.md section 7.4); every other state is plain text. */
export function statusTone(status: LeadStatus): StatusTone {
  return status === "new" ? "caution" : "neutral";
}

export const LEADS_PAGE_SIZE = 20;

export interface LeadListParams {
  page: number;
  status?: LeadStatus;
  q?: string;
  sort: LeadSort;
  order: LeadOrder;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads the list's filters from the page URL, ignoring anything that is not a valid value. */
export function parseLeadParams(raw: RawParams): LeadListParams {
  const status = LEAD_STATUSES.find((value) => value === first(raw.status));
  const sort = LEAD_SORTS.find((value) => value === first(raw.sort)) ?? "createdAt";
  const page = Number.parseInt(first(raw.page) ?? "1", 10);
  const q = first(raw.q)?.trim().slice(0, 100);
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    status,
    q: q || undefined,
    sort,
    order: first(raw.order) === "asc" ? "asc" : "desc",
  };
}

/** The list's URL for some filters, leaving out the defaults so links stay short. */
export function leadsHref(params: LeadListParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.sort !== "createdAt") query.set("sort", params.sort);
  if (params.order !== "desc") query.set("order", params.order);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/crm/leads?${text}` : "/crm/leads";
}
