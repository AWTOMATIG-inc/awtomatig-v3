import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Reads the payload of one of Better Auth's own link tokens (an HS256 JWT signed with the app secret), or null when the
 * signature, the algorithm or the expiry is wrong. Used only to learn which two addresses a change-email link was about, after
 * Better Auth itself accepted the link. Written with `node:crypto` so the backend needs no direct dependency on Better Auth's JWT
 * library. It never throws and never logs the token.
 */
export function readSignedToken(token: string, secret: string, now: Date = new Date()): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts as [string, string, string];

  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest();
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const head = JSON.parse(Buffer.from(header, "base64url").toString("utf8")) as { alg?: unknown };
    if (head.alg !== "HS256") return null;
    const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    if (typeof body.exp === "number" && body.exp * 1000 <= now.getTime()) return null;
    return body;
  } catch {
    return null;
  }
}
