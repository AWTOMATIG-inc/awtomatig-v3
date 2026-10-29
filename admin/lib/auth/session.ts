import "server-only";

import { redirect } from "next/navigation";

import { serverApi } from "@/lib/api/server";

export interface Session {
  user: { name: string; role: string };
  /** Permission keys of the form `module.resource.action`. The UI hides what a user may not do; the backend enforces it. */
  permissions: readonly string[];
}

/**
 * The signed-in employee, from the backend's session endpoint (the visitor's cookie is forwarded). Null means signed out,
 * and also means the backend could not be reached: the admin fails closed.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data } = await (await serverApi()).GET("/api/v1/auth/session");
    if (!data) return null;
    const role = data.roles[0] ?? "employee";
    return {
      user: { name: data.user.name, role: role.charAt(0).toUpperCase() + role.slice(1) },
      permissions: data.permissions,
    };
  } catch {
    return null;
  }
}

/** For layouts and pages that need a signed-in employee. Anyone else is sent to /login. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export function can(session: Session, permission: string): boolean {
  return session.permissions.some((grant) => {
    if (grant === "*" || grant === permission) return true;
    return grant.endsWith(".*") && permission.startsWith(grant.slice(0, -1));
  });
}
