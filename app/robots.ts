import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Vercel preview deployments must not be indexed; outside Vercel (VERCEL_ENV unset) the site is treated as production
const isPreview = process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== "production";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isPreview ? { userAgent: "*", disallow: "/" } : { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
  };
}
