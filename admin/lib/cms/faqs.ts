import type { StatusTone } from "@/components/ui";
import type { components } from "@/lib/api/schema";

import { first, type RawParams } from "./case-studies";

export type Faq = components["schemas"]["FaqDto"];
export type FaqStatus = Faq["status"];
export type FaqSort = "sortOrder" | "createdAt" | "question";
export type FaqOrder = "asc" | "desc";

export const FAQ_STATUSES: readonly FaqStatus[] = ["draft", "published"];
export const FAQ_SORTS: readonly FaqSort[] = ["sortOrder", "createdAt", "question"];

export const FAQ_STATUS_LABEL: Record<FaqStatus, string> = { draft: "Draft", published: "Published" };

/** The same limits as the backend (it repeats the checks); the form uses them for feedback while typing. */
export const QUESTION_MAX_LENGTH = 200;
export const ANSWER_MAX_LENGTH = 1000;

/**
 * The pages that show the shared FAQ list, in words, for the notes on the list and edit screens. The admin cannot discover this
 * from the backend (the list has no page column by design), so update it when the shared FAQ section is placed on another page.
 * The cleaning landing page keeps its own questions in code and is not listed.
 */
export const FAQ_PAGES = "Contact";

/** A plain draft and a published FAQ carry no color: neither is a problem. */
export const faqTone = (): StatusTone => "neutral";

export const FAQS_PAGE_SIZE = 20;

export interface FaqListParams {
  page: number;
  status?: FaqStatus;
  q?: string;
  sort: FaqSort;
  order: FaqOrder;
}

/** Reads the list's filters from the page URL, ignoring anything that is not a valid value. */
export function parseFaqParams(raw: RawParams): FaqListParams {
  const status = FAQ_STATUSES.find((value) => value === first(raw.status));
  const sort = FAQ_SORTS.find((value) => value === first(raw.sort)) ?? "sortOrder";
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
export function faqsHref(params: FaqListParams): string {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.sort !== "sortOrder") query.set("sort", params.sort);
  if (params.order !== "asc") query.set("order", params.order);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/cms/faqs?${text}` : "/cms/faqs";
}

/** Display order can only be changed on the whole list in its own order: not while filtered, searched or sorted another way. */
export const isFaqListReorderable = (params: FaqListParams) =>
  !params.status && !params.q && params.sort === "sortOrder" && params.order === "asc";

export const faqHref = (id: string) => `/cms/faqs/${id}`;

/** A message the edit page shows once, after a save that only half worked (the FAQ was created but publishing failed). */
export type FaqNotice = "publish-failed";
export const FAQ_NOTICE_TEXT: Record<FaqNotice, string> = {
  "publish-failed": "The FAQ was saved as a draft, but it could not be published. Try Publish again.",
};
export const parseFaqNotice = (value: string | string[] | undefined): FaqNotice | null =>
  first(value) === "publish-failed" ? "publish-failed" : null;

/** The answer as one short line for the list: collapsed whitespace, cut at a word where it can be. */
export function answerExcerpt(answer: string, max = 120): string {
  const text = answer.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, "")}…`;
}
