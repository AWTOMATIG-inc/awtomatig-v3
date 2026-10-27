import type { MetadataRoute } from "next";
import { PRIVACY_POLICY, TERMS } from "@/app/components/sections/shared/legal/legal";
import { CASE_STUDIES } from "@/app/components/sections/shared/case-studies/caseStudies";
import { SERVICES } from "@/lib/services";
import { ROUTES, SITE } from "@/lib/site";

export const dynamic = "force-static";

// Last meaningful content change per route. Update the date when a page's content changes (Google reads lastmod,
// not changefreq or priority). Legal pages use their own "Last updated" date.
const CONTENT_UPDATED = "2026-10-27";
const LAST_MODIFIED: Record<string, string> = { "/privacy": PRIVACY_POLICY.updated, "/terms": TERMS.updated };

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...ROUTES,
    ...SERVICES.map((service) => `/services/${service.id}`),
    ...CASE_STUDIES.map((study) => `/case-studies/${study.id}`),
  ];
  return paths.map((path) => ({
    url: new URL(path, SITE.url).toString(),
    lastModified: LAST_MODIFIED[path] ?? CONTENT_UPDATED,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
