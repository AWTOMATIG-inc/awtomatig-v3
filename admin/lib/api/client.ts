import createClient from "openapi-fetch";

import type { paths } from "./schema";

/**
 * Typed API client for the browser. Types are generated from the backend's OpenAPI document (`npm run api:generate`),
 * never written by hand. Requests go to this app's own origin; next.config.ts rewrites /api/* to the backend, so the
 * httpOnly session cookie is sent automatically and CORS is not involved.
 */
export const api = createClient<paths>({ baseUrl: "", credentials: "same-origin" });
