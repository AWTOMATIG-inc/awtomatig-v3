import { z } from "zod";

import type { components } from "@/lib/api/schema";

import { type CaseStudy, SERVICE_IDS, type ServiceId } from "./case-studies";

export type CreateCaseStudyBody = components["schemas"]["CreateCaseStudyDto"];
export type UpdateCaseStudyBody = components["schemas"]["UpdateCaseStudyDto"];

/** The same counts as the backend: four results or none, at most eight tags. */
export const STAT_COUNT = 4;
export const MAX_TAGS = 8;

export interface StatValues {
  value: string;
  label: string;
}

/** Everything is a string, like the inputs. Tags are one comma-separated field. */
export interface CaseStudyFormValues {
  title: string;
  /** Only used when creating: the study's web address. Left empty, it is built from the title. */
  slug: string;
  client: string;
  summary: string;
  service: ServiceId;
  category: ServiceId;
  challenge: string;
  description: string;
  tags: string;
  stats: StatValues[];
  seoTitle: string;
  seoDescription: string;
}

/** Lowercase ASCII words joined by dashes, at most 60 characters: the same rule as the backend, so the preview matches the result. */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "case-study";
}

/** `Next.js, Admin Dashboard` becomes two tags. Blanks and repeats (ignoring case) are dropped. */
export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of text.split(",")) {
    const tag = part.trim();
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      tags.push(tag);
    }
  }
  return tags;
}

const serviceEnum = z.enum(SERVICE_IDS as [ServiceId, ...ServiceId[]]);

/** The checks that give feedback while typing. The backend repeats all of them and has the final word. */
export function caseStudyFormSchema(options: { editing: boolean }) {
  return z
    .object({
      title: z.string().trim().min(1, "Enter the case study's name").max(120, "Use 120 characters or fewer"),
      slug: z
        .string()
        .trim()
        .max(60, "Use 60 characters or fewer")
        .refine(
          (value) => options.editing || value === "" || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value),
          "Use lowercase letters, digits and single dashes",
        ),
      client: z.string().trim().min(1, "Enter the client's name").max(120, "Use 120 characters or fewer"),
      summary: z.string().trim().min(1, "Write a one-line summary").max(300, "Use 300 characters or fewer"),
      service: serviceEnum,
      category: serviceEnum,
      challenge: z.string().trim().min(1, "Describe the challenge").max(400, "Use 400 characters or fewer"),
      description: z.string().trim().min(1, "Describe the project").max(2000, "Use 2,000 characters or fewer"),
      tags: z.string().refine((value) => {
        const tags = parseTags(value);
        return tags.length <= MAX_TAGS && tags.every((tag) => tag.length <= 40);
      }, `Up to ${MAX_TAGS} tags, each 40 characters or fewer`),
      stats: z.array(
        z.object({
          value: z.string().trim().max(20, "Use 20 characters or fewer"),
          label: z.string().trim().max(60, "Use 60 characters or fewer"),
        }),
      ),
      seoTitle: z.string().trim().max(120, "Use 120 characters or fewer"),
      seoDescription: z.string().trim().max(300, "Use 300 characters or fewer"),
    })
    .superRefine((values, context) => {
      // The website shows four results in a 2 x 2 grid, or none. A half-filled set would be dropped by the backend's check.
      const filled = values.stats.filter((stat) => stat.value !== "" || stat.label !== "");
      const complete = filled.every((stat) => stat.value !== "" && stat.label !== "");
      if (filled.length > 0 && (filled.length !== STAT_COUNT || !complete)) {
        context.addIssue({
          code: "custom",
          path: ["stats"],
          message: `Fill in all ${STAT_COUNT} results (a number and a label each), or leave all of them empty.`,
        });
      }
    });
}

const emptyStats = (): StatValues[] => Array.from({ length: STAT_COUNT }, () => ({ value: "", label: "" }));

export function toFormValues(study?: CaseStudy): CaseStudyFormValues {
  return {
    title: study?.title ?? "",
    slug: study?.slug ?? "",
    client: study?.client ?? "",
    summary: study?.summary ?? "",
    service: study?.service ?? "website-infrastructure",
    category: study?.category ?? "website-infrastructure",
    challenge: study?.challenge ?? "",
    description: study?.description ?? "",
    tags: study?.tags.join(", ") ?? "",
    stats: study && study.stats.length === STAT_COUNT ? study.stats.map(({ value, label }) => ({ value, label })) : emptyStats(),
    seoTitle: study?.seoTitle ?? "",
    seoDescription: study?.seoDescription ?? "",
  };
}

/** The request's list of results: the four rows, or an empty list when every row is blank. */
function toStats(stats: StatValues[]): StatValues[] {
  const rows = stats.map(({ value, label }) => ({ value: value.trim(), label: label.trim() }));
  return rows.every((row) => row.value === "" && row.label === "") ? [] : rows;
}

export function toCreateBody(values: CaseStudyFormValues): CreateCaseStudyBody {
  const slug = values.slug.trim();
  return {
    title: values.title.trim(),
    ...(slug ? { slug } : {}),
    client: values.client.trim(),
    summary: values.summary.trim(),
    service: values.service,
    category: values.category,
    challenge: values.challenge.trim(),
    description: values.description.trim(),
    tags: parseTags(values.tags),
    stats: toStats(values.stats),
    seoTitle: values.seoTitle.trim(),
    seoDescription: values.seoDescription.trim(),
  };
}

/** Every editable field. The web address is fixed once a study exists, so it is never sent. */
export function toUpdateBody(values: CaseStudyFormValues): UpdateCaseStudyBody {
  const { slug: _slug, ...rest } = toCreateBody(values);
  void _slug;
  return rest;
}
