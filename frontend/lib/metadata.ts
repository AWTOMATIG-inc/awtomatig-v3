import type { Metadata } from "next";
import { SHARE_IMAGE, SITE } from "./site";

type PageMetadataInput = {
  /** Page name; the root layout's template turns it into "<title> | AWTOMATIG". Omit for Home (uses the default title). */
  title?: string;
  description: string;
  /** Route path, e.g. "/services"; becomes the canonical URL and og:url (resolved against metadataBase) */
  path: string;
};

/**
 * Per-page metadata: title, description, canonical URL, and Open Graph / Twitter fields that repeat them.
 * A page's `openGraph` replaces the layout's entirely (no deep merge), so the shared fields (and the image) are repeated here.
 */
export function pageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const fullTitle = title ? `${title} | ${SITE.name}` : SITE.title;
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image", site: SITE.twitterHandle, title: fullTitle, description, images: [SHARE_IMAGE] },
  };
}
