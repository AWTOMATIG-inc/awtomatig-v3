import type { StatusTone } from "@/components/ui";
import type { components } from "@/lib/api/schema";

import { first, type RawParams } from "./case-studies";

export type Testimonial = components["schemas"]["TestimonialDto"];
export type TestimonialStatus = Testimonial["status"];
export type TestimonialSort = "sortOrder" | "createdAt" | "name" | "company";
export type TestimonialOrder = "asc" | "desc";

export const TESTIMONIAL_STATUSES: readonly TestimonialStatus[] = ["draft", "published"];
export const TESTIMONIAL_SORTS: readonly TestimonialSort[] = ["sortOrder", "createdAt", "name", "company"];

export const TESTIMONIAL_STATUS_LABEL: Record<TestimonialStatus, string> = { draft: "Draft", published: "Published" };

/** The same limits as the backend (it repeats the checks); the form uses them for feedback while typing. */
export const QUOTE_MAX_LENGTH = 600;
/** Above this the form warns: every card on the website stretches to the tallest one. */
export const QUOTE_WARN_LENGTH = 350;

/** The sentence the client's agreement is recorded with. The same words are used on the form and in the dialogs. */
export const CONSENT_SENTENCE = "The client has agreed to this quote being published with their name and company.";

/** What a person reads in the Status column. A draft without the client's agreement cannot be published yet, so it says so. */
export function testimonialStateLabel(testimonial: { status: TestimonialStatus; consentConfirmed: boolean }): string {
  return testimonial.status === "draft" && !testimonial.consentConfirmed
    ? "Draft, needs agreement"
    : TESTIMONIAL_STATUS_LABEL[testimonial.status];
}

/** A plain draft and a published testimonial carry no color; a draft that still lacks the agreement gets the caution dot (DESIGN.md 7.4). */
export function testimonialTone(testimonial: { status: TestimonialStatus; consentConfirmed: boolean }): StatusTone {
  return testimonial.status === "draft" && !testimonial.consentConfirmed ? "caution" : "neutral";
}

export const TESTIMONIALS_PAGE_SIZE = 20;

export interface TestimonialListParams {
  page: number;
  status?: TestimonialStatus;
  q?: string;
  sort: TestimonialSort;
  order: TestimonialOrder;
}

/** Reads the list's filters from the page URL, ignoring anything that is not a valid value. */
export function parseTestimonialParams(raw: RawParams): TestimonialListParams {
  const status = TESTIMONIAL_STATUSES.find((value) => value === first(raw.status));
  const sort = TESTIMONIAL_SORTS.find((value) => value === first(raw.sort)) ?? "sortOrder";
  const page = Number.parseInt(first(raw.page) ?? "1", 10);
  const q = first(raw.q)?.trim().slice(0, 100);
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    status,
    q: q || undefined,
    sort,
    order: first(raw.order) === "desc" ? "desc" : "asc",
  };
}

/** The list's URL for some filters, leaving out the defaults (display order, ascending) so links stay short. */
export function testimonialsHref(params: TestimonialListParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.sort !== "sortOrder") query.set("sort", params.sort);
  if (params.order !== "asc") query.set("order", params.order);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/cms/testimonials?${text}` : "/cms/testimonials";
}

/** Display order can only be changed on the whole list in its own order: not while filtered, searched or sorted another way. */
export const isTestimonialListReorderable = (params: TestimonialListParams) =>
  !params.status && !params.q && params.sort === "sortOrder" && params.order === "asc";

export const testimonialHref = (id: string) => `/cms/testimonials/${id}`;

/** A message the edit page shows once, after a save that only half worked (the testimonial was created but a later step failed). */
export type TestimonialNotice = "logo-failed" | "publish-failed";
export const TESTIMONIAL_NOTICE_TEXT: Record<TestimonialNotice, string> = {
  "logo-failed": "The testimonial was saved as a draft, but its logo could not be uploaded. Upload it below, or leave it out.",
  "publish-failed": "The testimonial and its logo were saved, but it could not be published. Try Publish again.",
};
export const parseTestimonialNotice = (value: string | string[] | undefined): TestimonialNotice | null =>
  first(value) === "logo-failed" || first(value) === "publish-failed" ? (first(value) as TestimonialNotice) : null;

/** The quote as one short line for the list: collapsed whitespace, cut at a word where it can be. */
export function quoteExcerpt(quote: string, max = 110): string {
  const text = quote.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, "")}…`;
}
