import "server-only";

import { cookies } from "next/headers";
import createClient from "openapi-fetch";

import type { paths } from "./schema";

/**
 * Typed API client for Server Components and Route Handlers. It calls the backend directly (API_URL) and forwards the
 * visitor's cookies, so the backend sees the same session as the browser.
 */
export async function serverApi() {
  const cookieHeader = (await cookies()).toString();
  return createClient<paths>({
    baseUrl: process.env.API_URL ?? "http://127.0.0.1:4000",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    cache: "no-store",
  });
}
