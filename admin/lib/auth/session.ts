import "server-only";

import { redirect } from "next/navigation";

export interface Session {
  user: { name: string; role: string };
  /** Permission keys of the form `module.resource.action`. The UI hides what a user may not do; the backend enforces it. */
  permissions: readonly string[];
}

/**
 * The backend has no authentication module yet, so there is nothing to validate a session against. Until it exists:
 *  - development gets a fixed development user, so screens can be built;
 *  - everything else gets no session and is sent to /login. The admin fails closed.
 *
 * When the backend ships auth, replace this body with a call to its session endpoint through `serverApi()` (the visitor's
 * cookie is forwarded) and map the response to `Session`. Callers do not change.
 */
export async function getSession(): Promise<Session | null> {
  if (process.env.NODE_ENV === "development") {
    return { user: { name: "Development user", role: "Developer" }, permissions: ["*"] };
  }
  return null;
}

/** For layouts and pages that need a signed-in employee. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export function can(session: Session, permission: string): boolean {
  return session.permissions.includes("*") || session.permissions.includes(permission);
}
