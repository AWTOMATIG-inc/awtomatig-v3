import type { ServiceId } from "@/lib/services";

export type CaseStudyStat = { value: string; label: string };

/** The studies themselves come from the CMS (lib/caseStudies.ts, edited in the admin app); this file holds only their shape. */
export type CaseStudy = {
  /** The slug: the detail page URL (/case-studies/<id>), the React key and the heading id */
  id: string;
  title: string;
  summary: string;
  /** Detail page meta; the title is the page name (the layout adds the brand). Falls back to `title` / `summary`. */
  seoTitle?: string;
  seoDescription?: string;
  client: string;
  /** The service shown in the "Service:" row; resolved to its name through lib/services.ts */
  service: ServiceId;
  description: string;
  /** Detail page; the "View case study" button is shown only once it exists */
  href?: string;
  /** Showcase image on the public bucket, roughly 551×525; its corners are rounded in code (CASE_STUDY_IMAGE_RADIUS), not in the file */
  image: { src: string; width: number; height: number };
  imageAlt: string;
  /** Case Studies page only: the filter tab it appears under, and the left panel */
  category: ServiceId;
  challenge: string;
  tags: string[];
  /** Four results, shown 2×2; empty when the study has none */
  stats?: CaseStudyStat[];
};

/** Showcase images are plain rectangles; the rounding is applied here, not baked into the PNG (12px on phones, 20px from lg) */
export const CASE_STUDY_IMAGE_RADIUS = "rounded-12 lg:rounded-20";
