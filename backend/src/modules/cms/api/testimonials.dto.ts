import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { SERVICE_IDS } from "../domain/case-study";
import {
  createTestimonialSchema,
  listTestimonialsQuerySchema,
  reorderTestimonialsSchema,
  TESTIMONIAL_STATUSES,
  updateTestimonialSchema,
} from "../domain/testimonial";

const iso = z.iso.datetime();

// `.nullable()` on a response field comes out as an array type in openapi.json (a nestjs-zod quirk), so spell the union out.
const orNull = <T extends z.ZodType>(schema: T) => z.union([schema, z.null()]);

/** The company logo as the admin loads it: a public URL, never the bucket key. */
const logo = z.object({ url: z.url(), width: z.number().int(), height: z.number().int() });

const testimonial = z.object({
  id: z.uuid(),
  status: z.enum(TESTIMONIAL_STATUSES),
  /** Position on the website, lowest first. */
  sortOrder: z.number().int(),
  publishedAt: orNull(iso),
  createdAt: iso,
  updatedAt: iso,
  quote: z.string(),
  name: z.string(),
  role: z.string(),
  company: z.string(),
  service: z.enum(SERVICE_IDS),
  /** The client agreed to this quote being published with their name and company. Publishing needs it. */
  consentConfirmed: z.boolean(),
  /** The logo is drawn in black on the white card. */
  logoInBlack: z.boolean(),
  /** Null when there is no logo; the card then shows the company name instead. */
  logo: orNull(logo),
});

/** What the public website may see of a published testimonial: an allow-list, never the raw row. */
const publicTestimonial = z.object({
  quote: z.string(),
  name: z.string(),
  role: z.string(),
  company: z.string(),
  service: z.enum(SERVICE_IDS),
  logoInBlack: z.boolean(),
  logo: orNull(logo),
});

const list = z.object({
  items: z.array(testimonial),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export class CreateTestimonialDto extends createZodDto(createTestimonialSchema) {}
export class UpdateTestimonialDto extends createZodDto(updateTestimonialSchema) {}
export class ReorderTestimonialsDto extends createZodDto(reorderTestimonialsSchema) {}
export class TestimonialIdParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
export class ListTestimonialsQueryDto extends createZodDto(listTestimonialsQuerySchema) {}

export class TestimonialDto extends createZodDto(testimonial) {}
export class TestimonialListDto extends createZodDto(list) {}
export class PublicTestimonialListDto extends createZodDto(z.object({ items: z.array(publicTestimonial) })) {}
