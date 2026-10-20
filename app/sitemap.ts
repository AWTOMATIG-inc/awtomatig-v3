import type { MetadataRoute } from "next";
import { ROUTES, SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // The case study and service detail pages are "Coming soon" placeholders (noindex), so they stay out
  const paths = [...ROUTES];
  return paths.map((path) => ({
    url: new URL(path, SITE.url).toString(),
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
