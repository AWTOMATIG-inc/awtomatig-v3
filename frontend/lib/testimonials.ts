// Reads the published client testimonials from the backend's public `cms` endpoint (edited in the admin app). Server side only: the
// browser never calls the backend, and CRM_API_URL is the address the website's server reaches it at (http://127.0.0.1:4000 on
// the VPS). Logos are public files on the R2 bucket whose address is ASSETS_URL (the backend's R2_PUBLIC_BASE_URL).
import { SERVICES, type ServiceId } from "@/lib/services";

/** Safety net: a change reaches the site within this many seconds even if the backend's refresh call is missed. Normally it is instant. */
export const TESTIMONIALS_REVALIDATE_SECONDS = 60;

/** The cache tag on the list. The backend asks the website to drop it (app/api/revalidate) the moment a change affects the live site. */
export const TESTIMONIALS_TAG = "testimonials";

const SERVICE_IDS: readonly string[] = SERVICES.map((service) => service.id);

/** The only folder of the bucket a testimonial logo may come from (next.config.ts allows the same path for next/image). */
const LOGO_PATH_PREFIX = "/testimonial/";

export type Testimonial = {
  quote: string;
  /** The service tag on the card (which of our services the quote is about) */
  service: ServiceId;
  name: string;
  role: string;
  company: string;
  /** The company logo, or null: the card then shows the company name as text */
  logo: { src: string; width: number; height: number } | null;
  /** White logos are invisible on the white card, so they are shown in black */
  logoInBlack: boolean;
};

type PublicTestimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  service: string;
  logoInBlack: boolean;
  logo: { url: string; width: number; height: number } | null;
};

/** Where the logos may come from, or null while ASSETS_URL is not set (next.config.ts allows the same origin). */
function assetsOrigin(): string | null {
  const value = process.env.ASSETS_URL;
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLogo(value: unknown): value is NonNullable<PublicTestimonial["logo"]> {
  if (typeof value !== "object" || value === null) return false;
  const logo = value as Record<string, unknown>;
  return typeof logo.url === "string" && typeof logo.width === "number" && typeof logo.height === "number";
}

function isPublicTestimonial(value: unknown): value is PublicTestimonial {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.quote === "string" &&
    typeof t.name === "string" &&
    typeof t.role === "string" &&
    typeof t.company === "string" &&
    typeof t.service === "string" &&
    SERVICE_IDS.includes(t.service) &&
    typeof t.logoInBlack === "boolean" &&
    (t.logo === null || isLogo(t.logo))
  );
}

/**
 * The website's shape of a backend testimonial. A logo that cannot be drawn safely (from a host or folder next/image does not
 * allow) is dropped, not the testimonial: the card then shows the company name, like a testimonial that never had a logo.
 */
function toTestimonial(item: PublicTestimonial, origin: string): Testimonial {
  let logo: Testimonial["logo"] = null;
  if (item.logo) {
    const url = new URL(item.logo.url);
    if (url.origin === origin && url.pathname.startsWith(LOGO_PATH_PREFIX)) {
      logo = { src: item.logo.url, width: item.logo.width, height: item.logo.height };
    } else {
      console.error(`[testimonials] dropped the logo of "${item.company}": it is not in ${LOGO_PATH_PREFIX} on ASSETS_URL`);
    }
  }
  return {
    quote: item.quote,
    service: item.service as ServiceId,
    name: item.name,
    role: item.role,
    company: item.company,
    logo,
    logoInBlack: item.logoInBlack,
  };
}

// The last list that loaded, kept in this server process. If the backend is down when a page is rebuilt, the site keeps showing
// it instead of losing the section. A restart clears it; the pages already built are kept by Next.js either way.
let lastGood: Testimonial[] | null = null;

export type TestimonialsResult = { ok: true; testimonials: Testimonial[] } | { ok: false };

/** Published testimonials in display order. `ok: false` means none could be loaded and nothing earlier was kept. */
export async function getTestimonials(): Promise<TestimonialsResult> {
  const base = process.env.CRM_API_URL;
  if (!base) {
    console.warn("[testimonials] CRM_API_URL is not set, so no testimonials can be loaded");
    return lastGood ? { ok: true, testimonials: lastGood } : { ok: false };
  }
  const origin = assetsOrigin();
  if (!origin) {
    console.error("[testimonials] ASSETS_URL is not set (or not a URL), so no testimonial logo can be shown");
    return lastGood ? { ok: true, testimonials: lastGood } : { ok: false };
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/cms/public/testimonials`, {
      next: { revalidate: TESTIMONIALS_REVALIDATE_SECONDS, tags: [TESTIMONIALS_TAG] },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[testimonials] the backend refused the list, status", response.status);
      return lastGood ? { ok: true, testimonials: lastGood } : { ok: false };
    }
    const items = ((await response.json()) as { items?: unknown }).items;
    if (!Array.isArray(items)) throw new Error("the response has no items list");

    // A testimonial the page cannot draw (wrong shape) is skipped, not fatal.
    const testimonials = items.flatMap((item): Testimonial[] => {
      if (!isPublicTestimonial(item)) {
        console.error("[testimonials] skipped a testimonial with an unexpected shape");
        return [];
      }
      return [toTestimonial(item, origin)];
    });
    lastGood = testimonials;
    return { ok: true, testimonials };
  } catch (err) {
    console.error("[testimonials] could not load the list:", err instanceof Error ? err.message : err);
    return lastGood ? { ok: true, testimonials: lastGood } : { ok: false };
  }
}
