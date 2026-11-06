/**
 * Browser calls to the backend's authentication endpoints (Better Auth, mounted at /api/v1/auth). They go to this app's own
 * origin and next.config.ts rewrites them to the backend, so the httpOnly session cookie is set and sent without any
 * JavaScript touching it. Not part of openapi.json, so the few request and response shapes are written here.
 */
const BASE = "/api/v1/auth";

/** What the user is told for each error code the backend can answer. Anything else gets the generic line. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "The email or password is not correct.",
  INVALID_PASSWORD: "Your current password is not correct.",
  PASSWORD_UNCHANGED: "The new password must be different from the current one.",
  PASSWORD_TOO_SHORT: "The new password must be at least 12 characters.",
  PASSWORD_TOO_LONG: "The new password can be at most 128 characters.",
  EMAIL_CHANGE_UNAVAILABLE: "Your account cannot change its email here. Contact an administrator.",
  INVALID_TOKEN: "That link did not work. It may have expired or already been used.",
  EXPIRED_TOKEN: "That link has expired. Request a new one.",
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

/** The password rule the backend enforces (auth.factory.ts); the form repeats it for feedback only. */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

/**
 * Changes the signed-in employee's own password. With `signOutOtherDevices` every other session ends; this browser stays
 * signed in (the backend answers with a fresh cookie).
 */
export async function changePassword(currentPassword: string, newPassword: string, signOutOtherDevices: boolean): Promise<void> {
  await post("/change-password", { currentPassword, newPassword, revokeOtherSessions: signOutOtherDevices });
}

/**
 * Starts a change of the signed-in employee's sign-in email. The backend checks the current password first, then mails an
 * approval link to the CURRENT address (and, once that is opened, a confirmation link to the new one). It answers the same
 * whether or not the new address belongs to someone else, so a success only means "the request was accepted".
 */
export async function requestEmailChange(newEmail: string, currentPassword: string): Promise<void> {
  await post("/change-email", { newEmail, currentPassword });
}

/**
 * Requests a password reset link for the given address. The answer is always the same whether or not the account exists.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await post("/request-password-reset", { email, redirectTo: "/reset-password" });
}

/**
 * Resets the password using the token from the email link. All sessions of that employee are revoked.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await post("/reset-password", { token, newPassword });
}

/** Only same-site paths. Anything else (`//evil.test`, `https://…`) falls back to the dashboard. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value.startsWith("/login")) return "/";
  return value;
}
