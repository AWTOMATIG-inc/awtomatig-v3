import type { MetadataRoute } from "next";
import { ROUTES, SITE } from "@/lib/site";
import { CASE_STUDIES } from "@/app/components/sections/shared/case-studies/caseStudies";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...ROUTES, ...CASE_STUDIES.map((study) => `/case-studies/${study.id}`)];
  return paths.map((path) => ({
    url: new URL(path, SITE.url).toString(),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
