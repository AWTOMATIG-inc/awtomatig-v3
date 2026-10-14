import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { SHARE_IMAGE_PATH, SITE } from "@/lib/site";
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
const SHARE_IMAGE = { url: SHARE_IMAGE_PATH, width: 1200, height: 630, alt: SITE.title };

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
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: SITE.description, images: [SHARE_IMAGE] },
};

// Organization structured data. Static, code-owned values only; `<` is escaped as the Next.js JSON-LD guide advises.
const ORGANIZATION_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/images/awtomatig-logo.png`,
  email: SITE.email,
  description: SITE.description,
}).replace(/</g, "\\u003c");

export const viewport: Viewport = {
  // Lets the layout use env(safe-area-inset-*) so the fixed header clears notches / the dynamic island
  viewportFit: "cover",
  themeColor: "#1e1e1e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body className="bg-surface-inverse text-fg-inverse selection:bg-action-primary selection:text-on-action flex min-h-screen flex-col justify-between font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ORGANIZATION_JSON_LD }} />
        {children}
      </body>
    </html>
  );
}
