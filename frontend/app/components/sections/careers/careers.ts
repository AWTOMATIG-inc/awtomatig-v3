import type { JobSummary, JobType, WorkMode } from "@/lib/careers";

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contractual: "Contractual",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

const AMOUNT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** BDT only. Both amounts = a range, only the first = a fixed amount, none = "Negotiable". */
export function formatSalary({ salaryMin, salaryMax }: Pick<JobSummary, "salaryMin" | "salaryMax">): string {
  if (salaryMin === null) return "Negotiable";
  const from = AMOUNT.format(Number(salaryMin));
  return salaryMax === null ? `BDT ${from}` : `BDT ${from} to ${AMOUNT.format(Number(salaryMax))}`;
}

/** "15 November 2026" from the backend's YYYY-MM-DD (a calendar date, so no time zone shift). */
export function formatDate(date: string): string {
  return DATE.format(new Date(`${date}T00:00:00Z`));
}

/** One bullet per non-empty line (the Requirements and Benefits fields). */
export function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]\s+)/, "").trim())
    .filter(Boolean);
}

/** Paragraphs split on blank lines (the Description field). */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
