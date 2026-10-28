import type { NextConfig } from "next";

// The browser only ever talks to this app. /api/* is rewritten to the backend (API_URL), so the httpOnly session cookie is
// same-origin and CORS is not involved. Read at build time: rebuild after changing API_URL.
const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000";

// Production only: `next dev` needs 'unsafe-eval' for React's error overlay. 'unsafe-inline' scripts are Next.js's own
// bootstrap; the app loads nothing from third parties, so every other source is 'self'.
const CSP =
  process.env.NODE_ENV === "production"
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ].join("; ")
    : undefined;

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // The admin is never indexed (also set in the metadata and robots.ts).
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  ...(CSP ? [{ key: "Content-Security-Policy", value: CSP }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
