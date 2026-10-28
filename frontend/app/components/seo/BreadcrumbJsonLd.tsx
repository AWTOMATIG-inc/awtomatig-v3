"use client";

import { usePathname } from "next/navigation";
import { FOOTER_PAGES, SITE } from "@/lib/site";

const NAMES = new Map([...FOOTER_PAGES, ...SITE.legal].map((link) => [link.href, link.label]));

// BreadcrumbList for the top-level pages (Home > Page). Placeholder detail pages are noindex, so they get none.
export default function BreadcrumbJsonLd() {
  const pathname = usePathname();
  const name = NAMES.get(pathname);
  if (!name || pathname === "/") return null;

  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name, item: new URL(pathname, SITE.url).toString() },
    ],
  }).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
