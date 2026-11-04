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
        "media-src 'self' https://pub-15cceab11b2f454f828f50cb4ba7a3c5.r2.dev",
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

const ASSETS_URL = process.env.ASSETS_URL;
const ASSETS_PATTERNS: NonNullable<NextConfig["images"]>["remotePatterns"] = ASSETS_URL
  ? [
      {
        protocol: new URL(ASSETS_URL).protocol === "http:" ? "http" : "https",
        hostname: new URL(ASSETS_URL).hostname,
        pathname: "/case-study/**",
      },
    ]
  : [];

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ...(CSP ? [{ key: "Content-Security-Policy", value: CSP }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Server Actions default to 1 MB. The careers application form posts a resume (5 MB cap) plus its fields, so allow 6 MB.
  // Nginx must allow the same (client_max_body_size 6m). This applies to every Server Action, the contact form included.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  // Local images are imported from public/images. The one remote host is the public bucket that holds the case study images
  // (ASSETS_URL, the backend's R2_PUBLIC_BASE_URL), limited to its case-study/ folder. next/image fetches and optimizes them on
  // the server, so the browser only loads /_next/image and the CSP img-src needs no extra host. Read at build time.
  images: { formats: ["image/avif", "image/webp"], remotePatterns: ASSETS_PATTERNS },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
