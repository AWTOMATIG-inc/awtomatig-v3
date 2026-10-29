/**
 * Browser calls to the backend's authentication endpoints (Better Auth, mounted at /api/v1/auth). They go to this app's own
 * origin and next.config.ts rewrites them to the backend, so the httpOnly session cookie is set and sent without any
 * JavaScript touching it. Not part of openapi.json, so the few request and response shapes are written here.
 */
const BASE = "/api/v1/auth";

/** What the user is told for each error code the backend can answer. Anything else gets the generic line. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "The email or password is not correct.",
  INVALID_PASSWORD: "That password is not correct.",
  TOO_MANY_REQUESTS: "Too many attempts. Wait a minute and try again.",
  INVALID_ORIGIN: "This request was blocked. Reload the page and try again.",
};

export class AuthError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

async function post<T>(path: string, body: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError("NETWORK", "Cannot reach the server. Check your connection and try again.", 0);
  }
  const payload = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
  if (!response.ok) {
    const code = payload.code ?? (response.status === 429 ? "TOO_MANY_REQUESTS" : "UNKNOWN");
    throw new AuthError(code, MESSAGES[code] ?? "Something went wrong. Try again in a moment.", response.status);
  }
  return payload as T;
}

export async function signIn(email: string, password: string): Promise<void> {
  await post("/sign-in/email", { email, password });
}

export async function signOut(): Promise<void> {
  await post("/sign-out", {});
}

/** Only same-site paths. Anything else (`//evil.test`, `https://…`) falls back to the dashboard. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value.startsWith("/login")) return "/";
  return value;
}
