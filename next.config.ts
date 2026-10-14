import type { NextConfig } from "next";

// A static CSP (no nonce) so every route can stay statically rendered (AUDIT_FIX_PLAN.md 3.1). Production only:
// `next dev` needs 'unsafe-eval' for React's error overlay, so only ship the restrictive policy on a real deploy.
// Add a host to the relevant directive when a real analytics or CMS provider is introduced (Phases 5-6).
const CSP =
  process.env.NODE_ENV === "production"
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://assets.calendly.com",
        "style-src 'self' 'unsafe-inline' https://assets.calendly.com",
        "img-src 'self' data: blob: https://assets.calendly.com",
        "font-src 'self'",
        "connect-src 'self' https://calendly.com",
        "frame-src https://calendly.com",
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
