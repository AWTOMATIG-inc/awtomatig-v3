import type { NextConfig } from "next";

// A static CSP (no nonce) so every route can stay statically rendered (AUDIT_FIX_PLAN.md 3.1). Production only:
// `next dev` needs 'unsafe-eval' for React's error overlay, so only ship the restrictive policy on a real deploy.
// Google Tag Manager loads GA4 and Microsoft Clarity, so their hosts are allowed too; the tagmanager / gstatic / fonts
// hosts are only for GTM's Preview mode (Tag Assistant). A new tag added in GTM may need its host added here.
const GOOGLE_TAGS = "https://*.googletagmanager.com https://tagmanager.google.com";
const GOOGLE_ANALYTICS = "https://*.google-analytics.com https://*.analytics.google.com";
const CLARITY = "https://*.clarity.ms";

const CSP =
  process.env.NODE_ENV === "production"
    ? [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline' https://assets.calendly.com ${GOOGLE_TAGS} ${CLARITY}`,
        "style-src 'self' 'unsafe-inline' https://assets.calendly.com https://tagmanager.google.com https://fonts.googleapis.com",
        `img-src 'self' data: blob: https://assets.calendly.com ${GOOGLE_TAGS} ${GOOGLE_ANALYTICS} https://ssl.gstatic.com https://www.gstatic.com ${CLARITY} https://c.bing.com`,
        "font-src 'self' data: https://fonts.gstatic.com",
        `connect-src 'self' https://calendly.com ${GOOGLE_TAGS} ${GOOGLE_ANALYTICS} ${CLARITY} https://c.bing.com`,
        "frame-src https://calendly.com https://www.google.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self' mailto:",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ].join("; ")
    : undefined;

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ...(CSP ? [{ key: "Content-Security-Policy", value: CSP }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // No remote image patterns: every image is a local asset under public/images, imported and optimized by
  // next/image at build time. Add a pattern here only when a real external image host is needed (e.g. a CMS).
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
