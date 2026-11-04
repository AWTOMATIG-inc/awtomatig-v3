import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import {
  CASE_STUDY_STATUSES,
  createCaseStudySchema,
  listCaseStudiesQuerySchema,
  reorderCaseStudiesSchema,
  SERVICE_IDS,
  slugSchema,
  statSchema,
  updateCaseStudySchema,
} from "../domain/case-study";

const iso = z.iso.datetime();

// `.nullable()` on a response field comes out as an array type in openapi.json (a nestjs-zod quirk), so spell the union out.
const orNull = <T extends z.ZodType>(schema: T) => z.union([schema, z.null()]);

/** The showcase image as the admin and the website load it: a public URL, never the bucket key. */
const image = z.object({ url: z.url(), alt: z.string(), width: z.number().int(), height: z.number().int() });

const summary = z.object({
  id: z.uuid(),
  /** The URL (`/case-studies/<slug>`) and the image folder. Fixed once created. */
  slug: z.string(),
  title: z.string(),
  client: z.string(),
  service: z.enum(SERVICE_IDS),
  category: z.enum(SERVICE_IDS),
  status: z.enum(CASE_STUDY_STATUSES),
  /** Position on the website, lowest first. */
  sortOrder: z.number().int(),
  publishedAt: orNull(iso),
  createdAt: iso,
  /** Null until an image is uploaded. A study cannot be published without one. */
  image: orNull(image),
});

const detail = summary.extend({
  summary: z.string(),
  description: z.string(),
  challenge: z.string(),
  tags: z.array(z.string()),
  /** Four results, or none. */
  stats: z.array(statSchema),
  seoTitle: z.string(),
  seoDescription: z.string(),
  updatedAt: iso,
});

/** What the public website may see of a published study: an allow-list, never the raw row. No id, status or audit columns. */
const publicStudy = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  client: z.string(),
  service: z.enum(SERVICE_IDS),
  category: z.enum(SERVICE_IDS),
  description: z.string(),
  challenge: z.string(),
  tags: z.array(z.string()),
  stats: z.array(statSchema),
  seoTitle: z.string(),
  seoDescription: z.string(),
  publishedAt: orNull(iso),
  image,
});

const list = z.object({ items: z.array(summary), total: z.number().int(), page: z.number().int(), pageSize: z.number().int() });

export class CreateCaseStudyDto extends createZodDto(createCaseStudySchema) {}
export class UpdateCaseStudyDto extends createZodDto(updateCaseStudySchema) {}
export class ReorderCaseStudiesDto extends createZodDto(reorderCaseStudiesSchema) {}
export class CaseStudyIdParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
export class ListCaseStudiesQueryDto extends createZodDto(listCaseStudiesQuerySchema) {}

export class CaseStudyDto extends createZodDto(detail) {}
export class CaseStudyListDto extends createZodDto(list) {}
export class CaseStudySlugParamsDto extends createZodDto(z.object({ slug: slugSchema })) {}
export class PublicCaseStudyDto extends createZodDto(publicStudy) {}
export class PublicCaseStudyListDto extends createZodDto(z.object({ items: z.array(publicStudy) })) {}
