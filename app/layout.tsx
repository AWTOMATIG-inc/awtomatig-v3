import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import { SHARE_IMAGE, SITE } from "@/lib/site";
import { CONSENT_DEFAULT_SCRIPT } from "@/lib/consent";
import CookieConsent from "@/app/components/layout/cookie-consent/CookieConsent";
import "./globals.css";

// Body, UI copy and labels. No extra axes: nothing in the type scale sets font-optical-sizing, and Inter is only
// ever used between 12-22px (type-body-*, type-label-*), so the opsz axis would just add file weight unused.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Display and headings
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const DEFAULT_TITLE = SITE.title;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  // Pages set a short `title` ("Services"); the template adds the brand. Home uses the default.
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
    title: DEFAULT_TITLE,
    description: SITE.description,
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitterHandle,
    title: DEFAULT_TITLE,
    description: SITE.description,
    images: [SHARE_IMAGE],
  },
};

// Organization structured data. Static, code-owned values only; `<` is escaped as the Next.js JSON-LD guide advises.
const ORGANIZATION_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: { "@type": "ImageObject", url: `${SITE.url}/aw-512.jpg`, width: 768, height: 768 },
      image: {
        "@type": "ImageObject",
        url: `${SITE.url}${SHARE_IMAGE.url}`,
        width: SHARE_IMAGE.width,
        height: SHARE_IMAGE.height,
      },
      email: SITE.email,
      telephone: SITE.phone,
      description: SITE.description,
      address: { "@type": "PostalAddress", addressLocality: SITE.address.locality, addressCountry: SITE.address.country },
      areaServed: "Worldwide",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "sales",
          email: SITE.email,
          telephone: SITE.phone,
          availableLanguage: "English",
        },
      ],
      sameAs: [SITE.social.linkedin, SITE.social.instagram, SITE.social.x, SITE.social.medium].filter(Boolean),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: "en",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
  ],
}).replace(/</g, "\\u003c");

export const viewport: Viewport = {
  // Lets the layout use env(safe-area-inset-*) so the fixed header clears notches / the dynamic island
  viewportFit: "cover",
  themeColor: "#1e1e1e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      {SITE.gtmId && <GoogleTagManager gtmId={SITE.gtmId} />}
      <body className="bg-surface-inverse text-fg-inverse selection:bg-action-primary selection:text-on-action flex min-h-screen flex-col justify-between font-sans">
        {/* Consent defaults must reach the dataLayer before GTM loads (it loads after hydration) */}
        {SITE.gtmId && <script dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ORGANIZATION_JSON_LD }} />
        {/* Before the page in the DOM so a first-time keyboard visitor reaches the banner first, not after the footer */}
        {SITE.gtmId && <CookieConsent />}
        {children}
      </body>
    </html>
  );
}
