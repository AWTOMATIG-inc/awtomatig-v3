import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CASE_STUDIES_TAG } from "@/lib/caseStudies";
import { TESTIMONIALS_TAG } from "@/lib/testimonials";

// The cached lists the backend may ask us to drop. The query value is the backend's name for the list; unknown names are refused.
const TAGS: Record<string, string> = {
  "case-studies": CASE_STUDIES_TAG,
  testimonials: TESTIMONIALS_TAG,
};

// Called by the backend (server to server) right after a case study or testimonial is published, unpublished, edited, reordered or
// given a new image, so the change shows on the next visit instead of up to a minute later. It sends the shared LEAD_INGEST_KEY,
// like the inquiry and application calls in the other direction. Not a public endpoint: without the key it answers 401 and does
// nothing. `?tag=` picks the list; with no tag it means case studies, which is what the backend sent before tags existed.
export async function POST(request: Request) {
  const expected = process.env.LEAD_INGEST_KEY;
  const given = request.headers.get("x-ingest-key") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected ?? "");
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ revalidated: false }, { status: 401 });
  }
  const name = new URL(request.url).searchParams.get("tag") ?? "case-studies";
  const tag = Object.hasOwn(TAGS, name) ? TAGS[name] : undefined;
  if (!tag) return Response.json({ revalidated: false }, { status: 400 });

  // { expire: 0 }: no stale copy is served, the next visit rebuilds the pages that use the list.
  revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: true });
}
