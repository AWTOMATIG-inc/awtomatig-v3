import type { MetadataRoute } from "next";
import { PRIVACY_POLICY, TERMS } from "@/app/components/sections/shared/legal/legal";
import { getOpenJobs } from "@/lib/careers";
import { getCaseStudies } from "@/lib/caseStudies";
import { SERVICES } from "@/lib/services";
import { ROUTES, SITE } from "@/lib/site";

// Rebuilt at most once a minute (not frozen at build time) so a newly published opening reaches the sitemap without a deploy.
export const revalidate = 60;

// Last meaningful content change per route. Update the date when a page's content changes (Google reads lastmod,
// not changefreq or priority). Legal pages use their own "Last updated" date.
const CONTENT_UPDATED = "2026-10-27";
const LAST_MODIFIED: Record<string, string> = { "/privacy": PRIVACY_POLICY.updated, "/terms": TERMS.updated };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [...ROUTES, ...SERVICES.map((service) => `/services/${service.id}`)];
  const pages: MetadataRoute.Sitemap = paths.map((path) => ({
    url: new URL(path, SITE.url).toString(),
    lastModified: LAST_MODIFIED[path] ?? CONTENT_UPDATED,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));

  // Published case studies only. If the backend cannot be reached they are left out this time: the sitemap is still valid.
  const studies = await getCaseStudies();
  const caseStudies: MetadataRoute.Sitemap = studies.ok
    ? studies.studies.map((study) => ({
        url: new URL(`/case-studies/${study.id}`, SITE.url).toString(),
        lastModified: CONTENT_UPDATED,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }))
    : [];

  // Open positions only. If the backend cannot be reached the sitemap simply has no job URLs this time: it is still valid.
  const jobs = await getOpenJobs();
  const openings: MetadataRoute.Sitemap = jobs.ok
    ? jobs.jobs
        .filter((job) => job.acceptingApplications)
        .map((job) => ({
          url: new URL(`/careers/${job.slug}`, SITE.url).toString(),
          ...(job.publishedAt && { lastModified: job.publishedAt }),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }))
    : [];

  return [...pages, ...caseStudies, ...openings];
}
