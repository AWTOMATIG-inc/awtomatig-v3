import { z } from "zod";

/** `stat` is a whole number with an optional unit (`5+`, `95%`), animated by the website's count-up; `rating` is 0.0 to 5.0. */
export type SiteMetricKind = "stat" | "rating";

export interface SiteMetricPlacement {
  /** The page as an employee knows it, for example "Home". */
  page: string;
  /** Where on the website the page lives. */
  route: string;
  /** The section of that page that shows the figure. */
  section: string;
}

export interface SiteMetricDefinition {
  key: string;
  /** The field title the admin shows. */
  title: string;
  kind: SiteMetricKind;
  /** The value the website shows until an employee changes it (also what the seed loads). */
  defaultValue: string;
  placements: SiteMetricPlacement[];
}

const HOME = { page: "Home", route: "/" };
const CONTACT = { page: "Contact", route: "/contact" };
const CLEANING = { page: "Cleaning landing page", route: "/cleaning-company-solutions" };

const CONTACT_PROVEN = { ...CONTACT, section: "Why AWTOMATIG (stat cards)" };
const CLEANING_PROVEN = { ...CLEANING, section: "Trust / Proof (stat cards)" };
const HOME_RESULTS = { ...HOME, section: "Trusted operations (results card)" };
const HOME_HERO = { ...HOME, section: "Hero (rating badges)" };
const CLEANING_HERO = { ...CLEANING, section: "Hero (rating badges)" };

/**
 * Every number the website can show from the admin. A key is wired to specific places in the website's code, so the set is
 * fixed here: adding a slot is a code change on both sides. When the website starts showing a figure in a new place, add that
 * place to `placements` in the same change, so the admin keeps telling the truth about where an edit goes live.
 */
export const SITE_METRICS: readonly SiteMetricDefinition[] = [
  {
    key: "years_experience",
    title: "Years of experience",
    kind: "stat",
    defaultValue: "5+",
    placements: [CONTACT_PROVEN, CLEANING_PROVEN],
  },
  {
    key: "businesses_supported",
    title: "Businesses supported",
    kind: "stat",
    defaultValue: "50+",
    placements: [CONTACT_PROVEN, CLEANING_PROVEN, HOME_RESULTS],
  },
  {
    key: "client_retention",
    title: "Client retention rate",
    kind: "stat",
    defaultValue: "95%",
    placements: [CONTACT_PROVEN, CLEANING_PROVEN],
  },
  {
    key: "systems_delivered",
    title: "Systems delivered",
    kind: "stat",
    defaultValue: "25+",
    placements: [CONTACT_PROVEN, CLEANING_PROVEN, HOME_RESULTS],
  },
  { key: "projects_completed", title: "Projects completed", kind: "stat", defaultValue: "75+", placements: [HOME_RESULTS] },
  {
    key: "client_systems_supported",
    title: "Client systems supported",
    kind: "stat",
    defaultValue: "35+",
    placements: [{ ...HOME, section: "Trusted operations (dark card)" }],
  },
  { key: "google_rating", title: "Google rating", kind: "rating", defaultValue: "4.8", placements: [HOME_HERO, CLEANING_HERO] },
  { key: "clutch_rating", title: "Clutch rating", kind: "rating", defaultValue: "4.8", placements: [HOME_HERO, CLEANING_HERO] },
  { key: "fiverr_rating", title: "Fiverr rating", kind: "rating", defaultValue: "4.8", placements: [HOME_HERO, CLEANING_HERO] },
];

export const SITE_METRIC_KEYS = SITE_METRICS.map((metric) => metric.key);

export function findSiteMetric(key: string): SiteMetricDefinition | undefined {
  return SITE_METRICS.find((metric) => metric.key === key);
}

/** The website's count-up reads `^(\D*)(\d+)(\D*)$`, so a stat is whole digits plus an optional unit, never a decimal or words. */
const STAT_FORMAT = /^\d{1,5}(\+|%|k|k\+|M|M\+)?$/;
const RATING_FORMAT = /^([0-4](\.\d)?|5(\.0)?)$/;

export const STAT_HINT = "A whole number with an optional + or %, for example 50+ or 95%";
export const RATING_HINT = "A rating from 0 to 5 with one decimal at most, for example 4.8";

export function hintFor(kind: SiteMetricKind): string {
  return kind === "stat" ? STAT_HINT : RATING_HINT;
}

/** A message when `value` is not a valid figure for this kind of slot, otherwise null. */
export function valueProblem(kind: SiteMetricKind, value: string): string | null {
  const ok = kind === "stat" ? STAT_FORMAT.test(value) : RATING_FORMAT.test(value);
  return ok ? null : hintFor(kind);
}

export const updateSiteMetricSchema = z.object({ value: z.string().trim().min(1).max(12) });
export type UpdateSiteMetricInput = z.infer<typeof updateSiteMetricSchema>;
