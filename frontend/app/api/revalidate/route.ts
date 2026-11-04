import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CASE_STUDIES_TAG } from "@/lib/caseStudies";

// Called by the backend (server to server) right after a case study is published, unpublished, edited, reordered or given a new
// image, so the change shows on the next visit instead of up to a minute later. It sends the shared LEAD_INGEST_KEY, like the
// inquiry and application calls in the other direction. Not a public endpoint: without the key it answers 401 and does nothing.
export async function POST(request: Request) {
  const expected = process.env.LEAD_INGEST_KEY;
  const given = request.headers.get("x-ingest-key") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected ?? "");
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ revalidated: false }, { status: 401 });
  }
  // { expire: 0 }: no stale copy is served, the next visit rebuilds the pages that use the list (Home, Case Studies, the campaign
  // page, the study pages, the sitemap).
  revalidateTag(CASE_STUDIES_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}
