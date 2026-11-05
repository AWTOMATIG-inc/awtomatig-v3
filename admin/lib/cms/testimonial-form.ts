import { z } from "zod";

import type { components } from "@/lib/api/schema";

import { SERVICE_IDS, type ServiceId } from "./case-studies";
import { QUOTE_MAX_LENGTH, type Testimonial } from "./testimonials";

export type CreateTestimonialBody = components["schemas"]["CreateTestimonialDto"];
export type UpdateTestimonialBody = components["schemas"]["UpdateTestimonialDto"];

/** Everything the form holds. `logoInBlack` is only a form field when creating; an existing testimonial has it in the logo panel. */
export interface TestimonialFormValues {
  quote: string;
  name: string;
  role: string;
  company: string;
  service: ServiceId;
  consentConfirmed: boolean;
  logoInBlack: boolean;
}

const serviceEnum = z.enum(SERVICE_IDS as [ServiceId, ...ServiceId[]]);

/** The checks that give feedback while typing. The backend repeats all of them and has the final word. */
export const testimonialFormSchema = z.object({
  quote: z.string().trim().min(1, "Enter the quote").max(QUOTE_MAX_LENGTH, `Use ${QUOTE_MAX_LENGTH} characters or fewer`),
  name: z.string().trim().min(1, "Enter the person's name").max(120, "Use 120 characters or fewer"),
  role: z.string().trim().min(1, "Enter the person's role").max(120, "Use 120 characters or fewer"),
  company: z.string().trim().min(1, "Enter the company's name").max(120, "Use 120 characters or fewer"),
  service: serviceEnum,
  consentConfirmed: z.boolean(),
  logoInBlack: z.boolean(),
});

export function toFormValues(testimonial?: Testimonial): TestimonialFormValues {
  return {
    quote: testimonial?.quote ?? "",
    name: testimonial?.name ?? "",
    role: testimonial?.role ?? "",
    company: testimonial?.company ?? "",
    service: testimonial?.service ?? "website-infrastructure",
    consentConfirmed: testimonial?.consentConfirmed ?? false,
    logoInBlack: testimonial?.logoInBlack ?? false,
  };
}

export function toCreateBody(values: TestimonialFormValues): CreateTestimonialBody {
  return {
    quote: values.quote.trim(),
    name: values.name.trim(),
    role: values.role.trim(),
    company: values.company.trim(),
    service: values.service,
    consentConfirmed: values.consentConfirmed,
    logoInBlack: values.logoInBlack,
  };
}

/**
 * The fields of the details form. The logo setting is saved by the logo panel, and the client's agreement is left out of a
 * live testimonial: it cannot be withdrawn while published, so it is never part of that save.
 */
export function toUpdateBody(values: TestimonialFormValues, options: { published: boolean }): UpdateTestimonialBody {
  const { logoInBlack: _logoInBlack, consentConfirmed, ...rest } = toCreateBody(values);
  void _logoInBlack;
  return options.published ? rest : { ...rest, consentConfirmed };
}
