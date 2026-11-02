import type { StatusTone } from "@/components/ui";
import type { components } from "@/lib/api/schema";

import { first, type RawParams } from "./jobs";

export type ApplicationSummary = components["schemas"]["ApplicationListDto"]["items"][number];
export type Application = components["schemas"]["ApplicationDto"];
export type ApplicationStatus = Application["status"];
export type ApplicationSort = "createdAt" | "fullName" | "status";
export type ApplicationOrder = "asc" | "desc";

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = ["new", "shortlisted", "interview", "hired", "rejected"];
export const APPLICATION_SORTS: readonly ApplicationSort[] = ["createdAt", "fullName", "status"];

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  shortlisted: "Shortlisted",
  interview: "Interview",
  hired: "Hired",
  rejected: "Rejected",
};

/** Only an application nobody has looked at yet gets a dot (DESIGN.md section 7.4); every other state is plain text. */
export function applicationTone(status: ApplicationStatus): StatusTone {
  return status === "new" ? "caution" : "neutral";
}

export const APPLICATIONS_PAGE_SIZE = 20;

export interface ApplicationListParams {
  page: number;
  status?: ApplicationStatus;
  q?: string;
  sort: ApplicationSort;
  order: ApplicationOrder;
}

/** Reads the applications list's filters from the page URL, ignoring anything that is not a valid value. */
export function parseApplicationParams(raw: RawParams): ApplicationListParams {
  const status = APPLICATION_STATUSES.find((value) => value === first(raw.status));
  const sort = APPLICATION_SORTS.find((value) => value === first(raw.sort)) ?? "createdAt";
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

/** The Applications tab of one opening, for some filters. Defaults are left out so links stay short. */
export function applicationsHref(jobId: string, params: ApplicationListParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.sort !== "createdAt") query.set("sort", params.sort);
  if (params.order !== "desc") query.set("order", params.order);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/recruitment/jobs/${jobId}?${text}` : `/recruitment/jobs/${jobId}`;
}

export const applicationHref = (jobId: string, applicationId: string) =>
  `/recruitment/jobs/${jobId}/applications/${applicationId}`;
