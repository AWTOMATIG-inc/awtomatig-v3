import type { StatusTone } from "@/components/ui";
import type { components } from "@/lib/api/schema";

export type CaseStudy = components["schemas"]["CaseStudyDto"];
export type CaseStudySummary = components["schemas"]["CaseStudyListDto"]["items"][number];
export type CaseStudyStatus = CaseStudy["status"];
export type ServiceId = CaseStudy["service"];
export type CaseStudySort = "sortOrder" | "createdAt" | "title";
export type CaseStudyOrder = "asc" | "desc";

export const SERVICE_IDS: readonly ServiceId[] = [
  "website-infrastructure",
  "back-office-operations",
  "erp-business-systems",
  "ad-tech",
];
export const CASE_STUDY_STATUSES: readonly CaseStudyStatus[] = ["draft", "published"];
export const CASE_STUDY_SORTS: readonly CaseStudySort[] = ["sortOrder", "createdAt", "title"];

/** The website's service names (frontend/lib/services.ts). Copied, not imported: the apps never import each other. */
export const SERVICE_LABEL: Record<ServiceId, string> = {
  "website-infrastructure": "Website Infrastructure",
  "back-office-operations": "Back-Office Operations",
  "erp-business-systems": "ERP & Business Systems",
  "ad-tech": "AdTech",
};

export const STATUS_LABEL: Record<CaseStudyStatus, string> = { draft: "Draft", published: "Published" };

/** What a person reads in the Status column. A draft with no image cannot be published yet, so it says so. */
export function caseStudyStateLabel(study: { status: CaseStudyStatus; image: unknown }): string {
  return study.status === "draft" && !study.image ? "Draft, no image" : STATUS_LABEL[study.status];
}

/** Published and plain drafts carry no color; a draft that still lacks its image gets the caution dot (DESIGN.md section 7.4). */
export function caseStudyTone(study: { status: CaseStudyStatus; image: unknown }): StatusTone {
  return study.status === "draft" && !study.image ? "caution" : "neutral";
}

export const CASE_STUDIES_PAGE_SIZE = 20;

export interface CaseStudyListParams {
  page: number;
  status?: CaseStudyStatus;
  q?: string;
  sort: CaseStudySort;
  order: CaseStudyOrder;
}

export type RawParams = Record<string, string | string[] | undefined>;

export const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads the list's filters from the page URL, ignoring anything that is not a valid value. */
export function parseCaseStudyParams(raw: RawParams): CaseStudyListParams {
  const status = CASE_STUDY_STATUSES.find((value) => value === first(raw.status));
  const sort = CASE_STUDY_SORTS.find((value) => value === first(raw.sort)) ?? "sortOrder";
  const page = Number.parseInt(first(raw.page) ?? "1", 10);
  const q = first(raw.q)?.trim().slice(0, 100);
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    status,
    q: q || undefined,
    sort,
    order: first(raw.order) === "desc" ? "desc" : "asc",
  };
}

/** The list's URL for some filters, leaving out the defaults (display order, ascending) so links stay short. */
export function caseStudiesHref(params: CaseStudyListParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.sort !== "sortOrder") query.set("sort", params.sort);
  if (params.order !== "asc") query.set("order", params.order);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/cms/case-studies?${text}` : "/cms/case-studies";
}

/** Display order can only be changed on the whole list in its own order: not while filtered, searched or sorted another way. */
export const isReorderable = (params: CaseStudyListParams) =>
  !params.status && !params.q && params.sort === "sortOrder" && params.order === "asc";

export const caseStudyHref = (id: string) => `/cms/case-studies/${id}`;

/** The most that can be put in order from the list screen. The backend takes more, but it lists 100 at a time. */
export const MAX_REORDERABLE = 100;

/** A message the edit page shows once, after a save that only half worked (the study was created but a later step failed). */
export type CaseStudyNotice = "image-failed" | "publish-failed";
export const NOTICE_TEXT: Record<CaseStudyNotice, string> = {
  "image-failed": "The case study was saved as a draft, but its image could not be uploaded. Upload it below.",
  "publish-failed": "The case study and its image were saved, but it could not be published. Try Publish again.",
};
export const parseNotice = (value: string | string[] | undefined): CaseStudyNotice | null =>
  first(value) === "image-failed" || first(value) === "publish-failed" ? (first(value) as CaseStudyNotice) : null;
