// Reads the published FAQs from the backend's public `cms` endpoint (edited in the admin app under Website → FAQs). One shared list:
// every page that renders <FaqSection /> without its own `items` shows it (Contact today). The cleaning landing page passes its own
// questions and never calls this. Server side only: the browser never calls the backend, and CRM_API_URL is the address the website's
// server reaches it at (http://127.0.0.1:4000 on the VPS).
import { FAQS, type FaqItem } from "@/app/components/sections/shared/faq/faq";

/** Safety net: a change reaches the site within this many seconds even if the backend's refresh call is missed. Normally it is instant. */
export const FAQS_REVALIDATE_SECONDS = 60;

/** The cache tag on the list. The backend asks the website to drop it (app/api/revalidate) the moment an FAQ changes. */
export const FAQS_TAG = "faqs";

function isFaq(value: unknown): value is FaqItem {
  if (typeof value !== "object" || value === null) return false;
  const faq = value as Record<string, unknown>;
  return typeof faq.question === "string" && faq.question !== "" && typeof faq.answer === "string" && faq.answer !== "";
}

// The last list that loaded, kept in this server process. If the backend is down when a page is rebuilt, the site keeps showing it.
// A restart clears it, and the built-in list in faq.ts takes over until the backend answers.
let lastGood: FaqItem[] | null = null;

/**
 * The FAQs to show, in display order. Never throws.
 * - The backend answered: its published list, which may be empty (the team published nothing, so the section is hidden).
 * - The backend could not be reached or refused: the last list that loaded, otherwise the built-in `FAQS`, so an outage never
 *   empties the section.
 */
export async function getFaqs(): Promise<FaqItem[]> {
  const fallback = () => lastGood ?? FAQS;
  const base = process.env.CRM_API_URL;
  if (!base) {
    console.warn("[faqs] CRM_API_URL is not set, so the built-in FAQs are shown");
    return fallback();
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/cms/public/faqs`, {
      next: { revalidate: FAQS_REVALIDATE_SECONDS, tags: [FAQS_TAG] },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[faqs] the backend refused the list, status", response.status);
      return fallback();
    }
    const faqs = ((await response.json()) as { faqs?: unknown }).faqs;
    if (!Array.isArray(faqs)) throw new Error("the response has no faqs list");

    // An entry the page cannot draw (wrong shape) is skipped, not fatal.
    const list = faqs.flatMap((faq): FaqItem[] => {
      if (!isFaq(faq)) {
        console.error("[faqs] skipped an FAQ with an unexpected shape");
        return [];
      }
      return [{ question: faq.question, answer: faq.answer }];
    });
    lastGood = list;
    return list;
  } catch (err) {
    console.error("[faqs] could not load the list:", err instanceof Error ? err.message : err);
    return fallback();
  }
}
