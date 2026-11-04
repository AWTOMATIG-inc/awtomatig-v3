import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";

// The browser only ever talks to this app. /api/* is rewritten to the backend (API_URL), so the httpOnly session cookie is
// same-origin and CORS is not involved. Read at build time: rebuild after changing API_URL. There is no default: the address
// belongs to the environment (admin/.env), so the app refuses to start or build without it.
const API_URL = process.env.API_URL;
if (!API_URL) {
  throw new Error("API_URL is not set. Add it to admin/.env (the backend's address, see .env.example) and start or build again.");
}

// The public address of the website's image bucket (the backend's R2_PUBLIC_BASE_URL). Case study images are shown from there, so
// the production CSP has to allow that one origin for images. Required to build and to start for production, like API_URL: without
// it every image in the admin would be blocked by the browser, which looks like a bug in the screen rather than in the setup.
// Checked by command below (`next build`, `next start`), so `next dev` and `npm run typecheck` (whose `next typegen` loads this
// file in the build phase too) do not need it.
const ASSETS_URL = process.env.ASSETS_URL;
const ASSETS_ORIGIN = ASSETS_URL ? new URL(ASSETS_URL).origin : null;
const COMMAND = process.argv.slice(2).find((arg) => ["build", "start", "dev", "typegen"].includes(arg));

// Production only: `next dev` needs 'unsafe-eval' for React's error overlay. 'unsafe-inline' scripts are Next.js's own
// bootstrap; the only third-party source is the public image bucket (images only), so every other source is 'self'.
const CSP =
  process.env.NODE_ENV === "production"
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        `img-src 'self' data: blob:${ASSETS_ORIGIN ? ` ${ASSETS_ORIGIN}` : ""}`,
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

export default function config(phase: string): NextConfig {
  const forProduction = phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;
  if (forProduction && (COMMAND === "build" || COMMAND === "start") && !ASSETS_URL) {
    throw new Error(
      "ASSETS_URL is not set. Add it to admin/.env (the public image bucket's address, see .env.example) and build or start again.",
    );
  }
  return {
    poweredByHeader: false,
    async headers() {
      return [{ source: "/:path*", headers: SECURITY_HEADERS }];
    },
    async rewrites() {
      return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
    },
  };
}
