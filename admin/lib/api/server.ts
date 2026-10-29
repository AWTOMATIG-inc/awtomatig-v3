import "server-only";

import { cookies } from "next/headers";
import createClient from "openapi-fetch";

import type { paths } from "./schema";

/**
 * Typed API client for Server Components and Route Handlers. It calls the backend directly (API_URL) and forwards the
 * visitor's cookies, so the backend sees the same session as the browser.
 */
export async function serverApi() {
  // No default address in code: it comes from admin/.env (API_URL).
  const baseUrl = process.env.API_URL;
  if (!baseUrl) throw new Error("API_URL is not set. Add it to admin/.env (see .env.example) and restart the app.");
  const cookieHeader = (await cookies()).toString();
  return createClient<paths>({
    baseUrl,
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
}
