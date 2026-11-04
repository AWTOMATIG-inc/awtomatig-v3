// Reads the published case studies from the backend's public `cms` endpoint (edited in the admin app). Server side only: the
// browser never calls the backend, and CRM_API_URL is the address the website's server reaches it at (http://127.0.0.1:4000 on
// the VPS). Images are public files on the R2 bucket whose address is ASSETS_URL (the backend's R2_PUBLIC_BASE_URL).
import type { CaseStudy } from "@/app/components/sections/shared/case-studies/caseStudies";
import { SERVICES } from "@/lib/services";

/** Safety net: a change reaches the site within this many seconds even if the backend's refresh call is missed. Normally it is instant. */
export const CASE_STUDIES_REVALIDATE_SECONDS = 60;

/** The cache tag on the list. The backend asks the website to drop it (app/api/revalidate) the moment a change affects the live site. */
export const CASE_STUDIES_TAG = "case-studies";

const SERVICE_IDS: readonly string[] = SERVICES.map((service) => service.id);

type PublicStudy = {
  slug: string;
  title: string;
  summary: string;
  client: string;
  service: string;
  category: string;
  description: string;
  challenge: string;
  tags: string[];
  stats: { value: string; label: string }[];
  seoTitle: string;
  seoDescription: string;
  image: { url: string; alt: string; width: number; height: number };
};

/** Where the images may come from, or null while ASSETS_URL is not set (next.config.ts allows the same origin). */
function assetsOrigin(): string | null {
  const value = process.env.ASSETS_URL;
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isPublicStudy(value: unknown): value is PublicStudy {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  const image = s.image as Record<string, unknown> | null | undefined;
  return (
    typeof s.slug === "string" &&
    typeof s.title === "string" &&
    typeof s.summary === "string" &&
    typeof s.client === "string" &&
    typeof s.description === "string" &&
    typeof s.challenge === "string" &&
    typeof s.service === "string" &&
    SERVICE_IDS.includes(s.service) &&
    typeof s.category === "string" &&
    SERVICE_IDS.includes(s.category) &&
    Array.isArray(s.tags) &&
    Array.isArray(s.stats) &&
    typeof image === "object" &&
    image !== null &&
    typeof image.url === "string" &&
    typeof image.alt === "string" &&
    typeof image.width === "number" &&
    typeof image.height === "number"
  );
}

/** The website's shape of a backend study. Empty SEO fields are left out so the pages fall back to the title and summary. */
function toCaseStudy(study: PublicStudy): CaseStudy {
  return {
    id: study.slug,
    title: study.title,
    summary: study.summary,
    ...(study.seoTitle && { seoTitle: study.seoTitle }),
    ...(study.seoDescription && { seoDescription: study.seoDescription }),
    client: study.client,
    service: study.service as CaseStudy["service"],
    description: study.description,
    href: `/case-studies/${study.slug}`,
    image: { src: study.image.url, width: study.image.width, height: study.image.height },
    imageAlt: study.image.alt,
    category: study.category as CaseStudy["category"],
    challenge: study.challenge,
    tags: study.tags,
    stats: study.stats,
  };
}

// The last list that loaded, kept in this server process. If the backend is down when a page is rebuilt, the site keeps showing
// it instead of going empty. A restart clears it; the pages already built are kept by Next.js either way.
let lastGood: CaseStudy[] | null = null;

export type CaseStudiesResult = { ok: true; studies: CaseStudy[] } | { ok: false };

/** Published case studies in display order. `ok: false` means none could be loaded and nothing earlier was kept. */
export async function getCaseStudies(): Promise<CaseStudiesResult> {
  const base = process.env.CRM_API_URL;
  if (!base) {
    console.warn("[case-studies] CRM_API_URL is not set, so no case studies can be loaded");
    return lastGood ? { ok: true, studies: lastGood } : { ok: false };
  }
  const origin = assetsOrigin();
  if (!origin) {
    console.error("[case-studies] ASSETS_URL is not set (or not a URL), so no case study image can be shown");
    return { ok: false };
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/cms/public/case-studies`, {
      next: { revalidate: CASE_STUDIES_REVALIDATE_SECONDS, tags: [CASE_STUDIES_TAG] },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[case-studies] the backend refused the list, status", response.status);
      return lastGood ? { ok: true, studies: lastGood } : { ok: false };
    }
    const items = ((await response.json()) as { items?: unknown }).items;
    if (!Array.isArray(items)) throw new Error("the response has no items list");

    // A study the page cannot draw (wrong shape, or an image from a host next/image does not allow) is skipped, not fatal.
    const studies = items.flatMap((item): CaseStudy[] => {
      if (!isPublicStudy(item)) {
        console.error("[case-studies] skipped a study with an unexpected shape");
        return [];
      }
      if (new URL(item.image.url).origin !== origin) {
        console.error(`[case-studies] skipped "${item.slug}": its image is not on ASSETS_URL`);
        return [];
      }
      return [toCaseStudy(item)];
    });
    lastGood = studies;
    return { ok: true, studies };
  } catch (err) {
    console.error("[case-studies] could not load the list:", err instanceof Error ? err.message : err);
    return lastGood ? { ok: true, studies: lastGood } : { ok: false };
  }
}

export type CaseStudyResult = { status: "ok"; study: CaseStudy } | { status: "not-found" } | { status: "error" };

/** One published study by slug. A draft, an unpublished or an unknown slug is `not-found`; `error` means the list could not be loaded. */
export async function getCaseStudy(slug: string): Promise<CaseStudyResult> {
  const result = await getCaseStudies();
  if (!result.ok) return { status: "error" };
  const study = result.studies.find((item) => item.id === slug);
  return study ? { status: "ok", study } : { status: "not-found" };
}
