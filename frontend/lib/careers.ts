// Reads the backend's public careers endpoints (the `recruitment` module). Server side only: the browser never calls the
// backend, and CRM_API_URL is the address the website's server reaches it at (http://127.0.0.1:4000 on the VPS).

export type JobType = "full_time" | "part_time" | "contractual";
export type WorkMode = "onsite" | "remote" | "hybrid";

export type JobSummary = {
  slug: string;
  title: string;
  jobType: JobType;
  workMode: WorkMode;
  vacancies: number;
  location: string;
  officeTiming: string;
  /** Decimal strings in BDT, never numbers; both null means "Negotiable", only the minimum means a fixed amount. */
  salaryMin: string | null;
  salaryMax: string | null;
  /** YYYY-MM-DD, valid through the end of that day in Dhaka. */
  deadlineOn: string;
  publishedAt: string | null;
  /** The backend decides this (status and deadline), so a closed job stops accepting at once even when the page is cached. */
  acceptingApplications: boolean;
};

export type JobQuestion = { id: string; position: number; text: string; required: boolean };

export type Job = JobSummary & {
  description: string;
  requirements: string;
  benefits: string;
  questions: JobQuestion[];
};

/** A new opening can take up to this long to show on the site; a closed one stops accepting at once anyway. */
export const CAREERS_REVALIDATE_SECONDS = 60;

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;

export function isJobSlug(value: string): boolean {
  return SLUG_RE.test(value);
}

/** The public jobs endpoint, or null while CRM_API_URL is not set. */
export function jobsEndpoint(path = ""): string | null {
  const base = process.env.CRM_API_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/api/v1/recruitment/public/jobs${path}`;
}

export type JobsResult = { ok: true; jobs: JobSummary[] } | { ok: false };

/** Open jobs, soonest deadline first. `ok: false` means the backend could not be reached, which is not the same as "no jobs". */
export async function getOpenJobs(): Promise<JobsResult> {
  const url = jobsEndpoint();
  if (!url) {
    console.warn("[careers] CRM_API_URL is not set, so no openings can be loaded");
    return { ok: false };
  }
  try {
    const response = await fetch(url, {
      next: { revalidate: CAREERS_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[careers] the backend refused the job list, status", response.status);
      return { ok: false };
    }
    const body: unknown = await response.json();
    const items = (body as { items?: unknown }).items;
    if (!Array.isArray(items)) return { ok: false };
    return { ok: true, jobs: items as JobSummary[] };
  } catch (err) {
    console.error("[careers] could not load the job list:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}

export type JobResult = { status: "ok"; job: Job } | { status: "not-found" } | { status: "error" };

/**
 * One job with its screening questions. A draft or unknown slug is `not-found`; a closed or expired job is `ok` with
 * `acceptingApplications: false`. `fresh` skips the cache, for the moment of an application.
 */
export async function getJob(slug: string, { fresh = false }: { fresh?: boolean } = {}): Promise<JobResult> {
  if (!isJobSlug(slug)) return { status: "not-found" };
  const url = jobsEndpoint(`/${slug}`);
  if (!url) {
    console.warn("[careers] CRM_API_URL is not set, so no job can be loaded");
    return { status: "error" };
  }
  try {
    const response = await fetch(url, {
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: CAREERS_REVALIDATE_SECONDS } }),
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) return { status: "not-found" };
    if (!response.ok) {
      console.error("[careers] the backend refused a job, status", response.status);
      return { status: "error" };
    }
    return { status: "ok", job: (await response.json()) as Job };
  } catch (err) {
    console.error("[careers] could not load a job:", err instanceof Error ? err.message : err);
    return { status: "error" };
  }
}
