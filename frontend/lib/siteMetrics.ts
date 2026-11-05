// Reads the website's trust numbers ("50+ businesses supported", the 4.8 ratings) from the backend's public `cms` endpoint (edited in
// the admin app under Website → Site Metrics). Server side only: the browser never calls the backend, and CRM_API_URL is the
// address the website's server reaches it at (http://127.0.0.1:4000 on the VPS).

/** Safety net: a change reaches the site within this many seconds even if the backend's refresh call is missed. Normally it is instant. */
export const SITE_METRICS_REVALIDATE_SECONDS = 60;

/** The cache tag on the figures. The backend asks the website to drop it (app/api/revalidate) the moment one is edited. */
export const SITE_METRICS_TAG = "site-metrics";

/**
 * Every figure the site shows, with the value used until the backend has answered. These are the owner-confirmed figures
 * (2026-11-05), so a backend that is down on a fresh start still leaves every card with its number. The keys match the backend's
 * catalog (backend/src/modules/cms/domain/site-metric.ts). Where a figure appears is listed there too: when a new place starts
 * showing one, add the place to that catalog so the admin keeps telling the truth.
 */
export const SITE_METRIC_DEFAULTS = {
  years_experience: "5+",
  businesses_supported: "50+",
  client_retention: "95%",
  systems_delivered: "25+",
  projects_completed: "75+",
  client_systems_supported: "35+",
  google_rating: "4.8",
  clutch_rating: "4.8",
  fiverr_rating: "4.8",
} as const;

export type SiteMetricKey = keyof typeof SITE_METRIC_DEFAULTS;
export type SiteMetrics = Record<SiteMetricKey, string>;

const KEYS = Object.keys(SITE_METRIC_DEFAULTS) as SiteMetricKey[];

// The same formats as the backend, so a bad value can never break the count-up or the stars: it falls back to the default.
const STAT_FORMAT = /^\d{1,5}(\+|%|k|k\+|M|M\+)?$/;
const RATING_FORMAT = /^([0-4](\.\d)?|5(\.0)?)$/;
const isRating = (key: SiteMetricKey) => key.endsWith("_rating");

// The last figures that loaded, kept in this server process: if the backend is down when a page is rebuilt, the site keeps showing
// them. A restart clears it, and the defaults above take over.
let lastGood: SiteMetrics | null = null;

/** Merges what the backend sent over the defaults, ignoring a key it does not know and any value in the wrong format. */
function merge(received: unknown): SiteMetrics {
  const merged: SiteMetrics = { ...(lastGood ?? SITE_METRIC_DEFAULTS) };
  if (typeof received !== "object" || received === null) return merged;
  const values = received as Record<string, unknown>;
  for (const key of KEYS) {
    const value = values[key];
    if (typeof value !== "string") continue;
    if ((isRating(key) ? RATING_FORMAT : STAT_FORMAT).test(value)) merged[key] = value;
    else console.error(`[site-metrics] ignored the value for ${key}: it is not in the expected format`);
  }
  return merged;
}

/** Every figure, always complete: the backend's value where it has a good one, otherwise the last good one, otherwise the default. */
export async function getSiteMetrics(): Promise<SiteMetrics> {
  const base = process.env.CRM_API_URL;
  if (!base) {
    console.warn("[site-metrics] CRM_API_URL is not set, so the built-in figures are shown");
    return lastGood ?? { ...SITE_METRIC_DEFAULTS };
  }

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/cms/public/site-metrics`, {
      next: { revalidate: SITE_METRICS_REVALIDATE_SECONDS, tags: [SITE_METRICS_TAG] },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[site-metrics] the backend refused the figures, status", response.status);
      return lastGood ?? { ...SITE_METRIC_DEFAULTS };
    }
    const values = ((await response.json()) as { values?: unknown }).values;
    if (typeof values !== "object" || values === null) throw new Error("the response has no values");
    lastGood = merge(values);
    return lastGood;
  } catch (err) {
    console.error("[site-metrics] could not load the figures:", err instanceof Error ? err.message : err);
    return lastGood ?? { ...SITE_METRIC_DEFAULTS };
  }
}
