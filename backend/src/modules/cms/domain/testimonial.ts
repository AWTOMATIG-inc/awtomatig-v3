import { z } from "zod";

import { SERVICE_IDS } from "./case-study";

/** `draft` is invisible to the public site, `published` is shown in the website's "Client testimonials" section. */
export const TESTIMONIAL_STATUSES = ["draft", "published"] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

export const TESTIMONIAL_SORT_FIELDS = ["sortOrder", "createdAt", "name", "company"] as const;
export type TestimonialSortField = (typeof TESTIMONIAL_SORT_FIELDS)[number];

/** The cards have a fixed width and stretch to the tallest one, so a very long quote makes every card tall. */
export const QUOTE_MAX_LENGTH = 600;

const text = (max: number) => z.string().trim().min(1).max(max);

const testimonialFields = {
  quote: text(QUOTE_MAX_LENGTH),
  name: text(120),
  role: text(120),
  company: text(120),
  /** The chip on the card: which of our services the quote is about. */
  service: z.enum(SERVICE_IDS),
  /** The client agreed to this quote being published with their name and company. Publishing needs it. */
  consentConfirmed: z.boolean(),
  /** Draw the logo in black: for a white or very light logo, which would be invisible on the white card. */
  logoInBlack: z.boolean(),
};

export const createTestimonialSchema = z.object({
  ...testimonialFields,
  consentConfirmed: testimonialFields.consentConfirmed.default(false),
  logoInBlack: testimonialFields.logoInBlack.default(false),
});
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;

export const updateTestimonialSchema = z
  .object(testimonialFields)
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: "Send at least one field to change" });
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;

export const listTestimonialsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(TESTIMONIAL_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(TESTIMONIAL_SORT_FIELDS).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
export type ListTestimonialsQuery = z.infer<typeof listTestimonialsQuerySchema>;

/** The complete display order: every testimonial id once. A partial list could silently shuffle the ones left out. */
export const reorderTestimonialsSchema = z.object({ ids: z.array(z.uuid()).min(1).max(500) });
export type ReorderTestimonialsInput = z.infer<typeof reorderTestimonialsSchema>;

/** Every logo of a testimonial lives in this folder of the public bucket, named by the row id, which never changes. */
export function logoFolder(id: string): string {
  return `testimonial/${id}/`;
}

/** A message when the testimonial cannot go live yet, otherwise null. The draft-only rule is checked by the caller. */
export function publishProblem(testimonial: { consentConfirmed: boolean }): string | null {
  return testimonial.consentConfirmed ? null : "Confirm the client agreed to this quote being published before publishing";
}

/**
 * A message when an edit is not allowed in the testimonial's current state, otherwise null. Withdrawing consent from a live
 * testimonial would leave a published quote without permission, so it has to be taken down first.
 */
export function editProblem(current: { status: string }, patch: UpdateTestimonialInput): string | null {
  if (current.status === "published" && patch.consentConfirmed === false)
    return "Unpublish the testimonial before withdrawing the client's agreement";
  return null;
}
