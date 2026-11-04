import { z } from "zod";

/** The website's four services (`frontend/lib/services.ts`). A new service is a code change in both places. */
export const SERVICE_IDS = ["website-infrastructure", "back-office-operations", "erp-business-systems", "ad-tech"] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

/** `draft` is invisible to the public site, `published` is listed on Home, the Case Studies page and the sitemap. */
export const CASE_STUDY_STATUSES = ["draft", "published"] as const;
export type CaseStudyStatus = (typeof CASE_STUDY_STATUSES)[number];

export const CASE_STUDY_SORT_FIELDS = ["sortOrder", "createdAt", "title"] as const;
export type CaseStudySortField = (typeof CASE_STUDY_SORT_FIELDS)[number];

/** A study shows exactly four results (2 x 2 on the Case Studies page), or none. */
export const STAT_COUNT = 4;
export const MAX_TAGS = 8;

const text = (max: number) => z.string().trim().min(1).max(max);

export const statSchema = z.object({ value: text(20), label: text(60) });
export type CaseStudyStat = z.infer<typeof statSchema>;

/** Lowercase ASCII words joined by single dashes: it becomes part of a URL and of the image folder name in the bucket. */
export const slugSchema = z
  .string()
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, digits and single dashes");

const studyFields = {
  title: text(120),
  summary: text(300),
  /** Name of the client as shown in the "Client:" row. */
  client: text(120),
  service: z.enum(SERVICE_IDS),
  /** The filter tab on the Case Studies page. */
  category: z.enum(SERVICE_IDS),
  /** Plain text. */
  description: text(2000),
  challenge: text(400),
  tags: z.array(text(40)).max(MAX_TAGS),
  /** Four results, or an empty list when there are no real figures yet. */
  stats: z.array(statSchema),
  /** Detail page meta. Blank means the page falls back to the title and summary. */
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(300),
};

const statsProblem = (stats: unknown[]) =>
  stats.length === 0 || stats.length === STAT_COUNT ? null : `Enter exactly ${STAT_COUNT} results, or none`;

export const createCaseStudySchema = z
  .object({
    ...studyFields,
    tags: studyFields.tags.default([]),
    stats: studyFields.stats.default([]),
    seoTitle: studyFields.seoTitle.default(""),
    seoDescription: studyFields.seoDescription.default(""),
    /** Fixed once created. Built from the title when left out. */
    slug: slugSchema.optional(),
  })
  .superRefine((value, context) => {
    const problem = statsProblem(value.stats);
    if (problem) context.addIssue({ code: "custom", path: ["stats"], message: problem });
  });
export type CreateCaseStudyInput = z.infer<typeof createCaseStudySchema>;

export const updateCaseStudySchema = z
  .object({
    ...studyFields,
    /** Describes the showcase image. Only for a study that already has one; the image itself is replaced with PUT /:id/image. */
    imageAlt: text(200),
  })
  .partial()
  .superRefine((value, context) => {
    const problem = value.stats === undefined ? null : statsProblem(value.stats);
    if (problem) context.addIssue({ code: "custom", path: ["stats"], message: problem });
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: "Send at least one field to change" });
export type UpdateCaseStudyInput = z.infer<typeof updateCaseStudySchema>;

export const listCaseStudiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(CASE_STUDY_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(CASE_STUDY_SORT_FIELDS).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
export type ListCaseStudiesQuery = z.infer<typeof listCaseStudiesQuerySchema>;

/** The complete display order: every case study id once. A partial list could silently shuffle the ones left out. */
export const reorderCaseStudiesSchema = z.object({ ids: z.array(z.uuid()).min(1).max(500) });
export type ReorderCaseStudiesInput = z.infer<typeof reorderCaseStudiesSchema>;

/** Lowercase ASCII words joined by dashes, at most 60 characters. A title with no ASCII letters or digits becomes `case-study`. */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    // The accent of "é" is a separate mark after NFKD; drop it, or it would turn into a dash inside the word.
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "case-study";
}

/** The folder in the public bucket that holds a study's images. The slug never changes, so neither does the folder. */
export function imageFolder(slug: string): string {
  return `case-study/${slug}/`;
}

/** A message when the study cannot go live yet, otherwise null. Draft-only rule is checked by the caller. */
export function publishProblem(study: { imageKey: string | null; imageAlt: string | null }): string | null {
  if (!study.imageKey) return "Upload the showcase image before publishing";
  if (!study.imageAlt?.trim()) return "Add the image's alt text before publishing";
  return null;
}

/** Escapes `%`, `_` and `\` so a search term is matched literally by `ILIKE`. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
