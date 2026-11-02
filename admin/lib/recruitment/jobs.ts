import type { StatusTone } from "@/components/ui";
import type { components } from "@/lib/api/schema";
import { formatAmount, formatMoney } from "@/lib/format";

export type Job = components["schemas"]["JobDto"];
export type JobSummary = components["schemas"]["JobListDto"]["items"][number];
export type JobStatus = Job["status"];
export type JobType = Job["jobType"];
export type WorkMode = Job["workMode"];
export type JobSort = "createdAt" | "deadlineOn" | "title";
export type JobOrder = "asc" | "desc";

export const JOB_TYPES: readonly JobType[] = ["full_time", "part_time", "contractual"];
export const WORK_MODES: readonly WorkMode[] = ["onsite", "remote", "hybrid"];
export const JOB_STATUSES: readonly JobStatus[] = ["draft", "open", "closed"];
export const JOB_SORTS: readonly JobSort[] = ["createdAt", "deadlineOn", "title"];

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contractual: "Contractual",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = { onsite: "On-site", remote: "Remote", hybrid: "Hybrid" };

/** What a person sees: the stored status, except that an open job past its deadline is "expired". */
export type JobState = JobStatus | "expired";

export const JOB_STATE_LABEL: Record<JobState, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  expired: "Expired",
};

export function jobState(job: { status: JobStatus; acceptingApplications: boolean }): JobState {
  return job.status === "open" && !job.acceptingApplications ? "expired" : job.status;
}

/** An expired job needs someone to close it or give it a new deadline, so it gets a dot (DESIGN.md section 7.4). Other states are plain text. */
export function jobStateTone(state: JobState): StatusTone {
  return state === "expired" ? "caution" : "neutral";
}

/** `Negotiable`, `BDT 50,000.00` (a fixed amount) or `BDT 50,000.00 to 80,000`. The amounts are decimal strings, never floats. */
export function formatSalary(min: string | null, max: string | null): string {
  if (min === null) return "Negotiable";
  return max === null ? formatMoney(min, "BDT") : `${formatMoney(min, "BDT")} to ${formatAmount(max)}`;
}

export const JOBS_PAGE_SIZE = 20;

export interface JobListParams {
  page: number;
  status?: JobStatus;
  q?: string;
  sort: JobSort;
  order: JobOrder;
}

export type RawParams = Record<string, string | string[] | undefined>;

export const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads the list's filters from the page URL, ignoring anything that is not a valid value. */
export function parseJobParams(raw: RawParams): JobListParams {
  const status = JOB_STATUSES.find((value) => value === first(raw.status));
  const sort = JOB_SORTS.find((value) => value === first(raw.sort)) ?? "createdAt";
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
export function jobsHref(params: JobListParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.sort !== "createdAt") query.set("sort", params.sort);
  if (params.order !== "desc") query.set("order", params.order);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/recruitment/jobs?${text}` : "/recruitment/jobs";
}

/** The two tabs of one opening's page. The URL carries the choice, so a view can be shared. */
export type JobTab = "applications" | "details";

export const jobHref = (id: string, tab: JobTab = "applications") =>
  tab === "applications" ? `/recruitment/jobs/${id}` : `/recruitment/jobs/${id}?tab=details`;
