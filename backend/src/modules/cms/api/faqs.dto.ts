import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { createFaqSchema, FAQ_STATUSES, listFaqsQuerySchema, reorderFaqsSchema, updateFaqSchema } from "../domain/faq";

const iso = z.iso.datetime();

// `.nullable()` on a response field comes out as an array type in openapi.json (a nestjs-zod quirk), so spell the union out.
const orNull = <T extends z.ZodType>(schema: T) => z.union([schema, z.null()]);

const faq = z.object({
  id: z.uuid(),
  status: z.enum(FAQ_STATUSES),
  /** Position on the website, lowest first. */
  sortOrder: z.number().int(),
  publishedAt: orNull(iso),
  createdAt: iso,
  updatedAt: iso,
  question: z.string(),
  /** Plain text; line breaks are kept. */
  answer: z.string(),
});

/** What the public website may see of a published FAQ: an allow-list, never the raw row. */
const publicFaq = z.object({ question: z.string(), answer: z.string() });

const list = z.object({
  items: z.array(faq),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export class CreateFaqDto extends createZodDto(createFaqSchema) {}
export class UpdateFaqDto extends createZodDto(updateFaqSchema) {}
export class ReorderFaqsDto extends createZodDto(reorderFaqsSchema) {}
export class FaqIdParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
export class ListFaqsQueryDto extends createZodDto(listFaqsQuerySchema) {}

export class FaqDto extends createZodDto(faq) {}
export class FaqListDto extends createZodDto(list) {}
export class PublicFaqListDto extends createZodDto(z.object({ faqs: z.array(publicFaq) })) {}
