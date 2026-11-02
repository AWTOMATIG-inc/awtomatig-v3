import { z } from "zod";

export const JOB_TYPES = ["full_time", "part_time", "contractual"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const WORK_MODES = ["onsite", "remote", "hybrid"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

/** `draft` is invisible to candidates, `open` takes applications until the deadline, `closed` was shut by an employee. */
export const JOB_STATUSES = ["draft", "open", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_SORT_FIELDS = ["createdAt", "deadlineOn", "title"] as const;
export type JobSortField = (typeof JOB_SORT_FIELDS)[number];

/** Screening questions that can be active on one job at a time. */
export const MAX_QUESTIONS = 20;

/** The company works on Dhaka time: a deadline is valid through the end of that calendar day there. */
export const DHAKA_TIME_ZONE = "Asia/Dhaka";

// Salary arrives as a decimal string so it is never a JS float. Up to 13 digits keeps it inside numeric(19,4) with room to spare.
const amount = z
  .string()
  .trim()
  .regex(/^\d{1,13}(\.\d{1,2})?$/, "Use digits with at most two decimals");

const questionText = z.string().trim().min(1).max(500);

export const questionInputSchema = z.object({
  /** Present when editing a question that already exists; omitted for a new one. */
  id: z.uuid().optional(),
  text: questionText,
  required: z.boolean().default(true),
});
export type QuestionInput = z.infer<typeof questionInputSchema>;

const jobFields = {
  title: z.string().trim().min(1).max(200),
  jobType: z.enum(JOB_TYPES),
  workMode: z.enum(WORK_MODES),
  vacancies: z.number().int().min(1).max(1000),
  location: z.string().trim().min(1).max(200),
  /** Free text, for example "Mon - Fri, 11 AM to 6 PM". */
  officeTiming: z.string().trim().min(1).max(200),
  /** Plain text. Blank lines separate paragraphs. */
  description: z.string().trim().min(1).max(10_000),
  /** Plain text, one bullet per line. */
  requirements: z.string().trim().max(10_000),
  /** Plain text, one bullet per line. */
  benefits: z.string().trim().max(10_000),
  /** BDT. Both empty = "Negotiable", only the minimum = a fixed amount, both = a range. */
  salaryMin: amount.nullable(),
  salaryMax: amount.nullable(),
  /** Last day applications are accepted, `YYYY-MM-DD`, Dhaka time. */
  deadlineOn: z.iso.date(),
};

export const createJobSchema = z
  .object({
    ...jobFields,
    requirements: jobFields.requirements.default(""),
    benefits: jobFields.benefits.default(""),
    salaryMin: jobFields.salaryMin.default(null),
    salaryMax: jobFields.salaryMax.default(null),
    /** Publish straight away instead of saving a draft. */
    publish: z.boolean().default(false),
    questions: z
      .array(questionInputSchema.omit({ id: true }))
      .max(MAX_QUESTIONS)
      .default([]),
  })
  .superRefine((value, context) => {
    const problem = salaryProblem(value.salaryMin, value.salaryMax);
    if (problem) context.addIssue({ code: "custom", path: ["salaryMax"], message: problem });
  });
export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = z
  .object(jobFields)
  .partial()
  .extend({
    /** The full list of active questions in the order they should show. Questions left out are archived, never deleted. */
    questions: z.array(questionInputSchema).max(MAX_QUESTIONS).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: "Send at least one field to change" });
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export const reopenJobSchema = z.object({
  /** A new last day. Needed when the old one has passed. */
  deadlineOn: z.iso.date().optional(),
});
export type ReopenJobInput = z.infer<typeof reopenJobSchema>;

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(JOB_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(JOB_SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>;

/** Today's calendar date in Dhaka as `YYYY-MM-DD`. Takes the clock as an argument so tests can fix it. */
export function dhakaDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * The one place that decides whether a job takes applications: it is open and its deadline day (Dhaka) has not passed.
 * No scheduled job closes anything; an open job simply stops accepting after the deadline.
 */
export function isAcceptingApplications(job: { status: string; deadlineOn: string }, now: Date): boolean {
  return job.status === "open" && job.deadlineOn >= dhakaDate(now);
}

/** A message when the deadline is already in the past (today still counts), otherwise null. */
export function deadlineProblem(deadlineOn: string, now: Date): string | null {
  return deadlineOn < dhakaDate(now) ? "The deadline cannot be in the past" : null;
}

/** A message when the salary combination does not make sense, otherwise null. Comparing two short decimals as numbers is exact. */
export function salaryProblem(min: string | null, max: string | null): string | null {
  if (max !== null && min === null) return "Enter a minimum salary before a maximum";
  if (max !== null && min !== null && Number(max) < Number(min)) return "The maximum salary cannot be below the minimum";
  return null;
}

/** `numeric(19,4)` comes back as `50000.0000`; show `50000` and `50000.5`. */
export function normalizeAmount(value: string | null): string | null {
  if (value === null) return null;
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}

/** Lowercase ASCII words joined by dashes, at most 50 characters. A title with no ASCII letters or digits becomes `job`. */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return slug || "job";
}

/** The slug is fixed at creation so a shared link keeps working when the title changes. The suffix keeps repeated titles apart. */
export function buildSlug(title: string, suffix: string): string {
  return `${slugify(title)}-${suffix}`;
}

/** Escapes `%`, `_` and `\` so a search term is matched literally by `ILIKE`. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
