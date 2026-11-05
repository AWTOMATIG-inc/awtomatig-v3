import { z } from "zod";

/** `draft` is invisible to the public site, `published` is shown in the FAQ section of every page that uses the shared list. */
export const FAQ_STATUSES = ["draft", "published"] as const;
export type FaqStatus = (typeof FAQ_STATUSES)[number];

export const FAQ_SORT_FIELDS = ["sortOrder", "createdAt", "question"] as const;
export type FaqSortField = (typeof FAQ_SORT_FIELDS)[number];

export const QUESTION_MAX_LENGTH = 200;
/** Plain text: the accordion renders the answer as one paragraph. Line breaks are kept. */
export const ANSWER_MAX_LENGTH = 1000;

/** The public list and the number of live FAQs are both capped, so the accordion and the response stay bounded. */
export const MAX_PUBLISHED_FAQS = 100;

const text = (max: number) => z.string().trim().min(1).max(max);

const faqFields = {
  question: text(QUESTION_MAX_LENGTH),
  answer: text(ANSWER_MAX_LENGTH),
};

export const createFaqSchema = z.object(faqFields);
export type CreateFaqInput = z.infer<typeof createFaqSchema>;

export const updateFaqSchema = z
  .object(faqFields)
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: "Send at least one field to change" });
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;

export const listFaqsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(FAQ_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(FAQ_SORT_FIELDS).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
export type ListFaqsQuery = z.infer<typeof listFaqsQuerySchema>;

/** The complete display order: every FAQ id once. A partial list could silently shuffle the ones left out. */
export const reorderFaqsSchema = z.object({ ids: z.array(z.uuid()).min(1).max(500) });
export type ReorderFaqsInput = z.infer<typeof reorderFaqsSchema>;

/** A message when the FAQ cannot go live because the website's list is full, otherwise null. */
export function publishProblem(publishedCount: number): string | null {
  return publishedCount >= MAX_PUBLISHED_FAQS
    ? `The website shows at most ${MAX_PUBLISHED_FAQS} FAQs. Unpublish one before publishing another`
    : null;
}
