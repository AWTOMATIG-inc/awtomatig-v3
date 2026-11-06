import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { AuditEntry } from "../audit/audit.service";
import { newId } from "../db/columns";
import { accounts, sessions, users, verifications } from "./auth.schema";
import { readSignedToken } from "./signed-token";

export interface AuthSettings {
  db: NodePgDatabase;
  secret: string;
  /** Public origin of the admin app. */
  baseURL: string;
  trustedOrigins: string[];
  /** Turned off in tests, which sign in many times from one address. */
  rateLimit: boolean;
  audit: (entry: AuditEntry) => Promise<void>;
  /** Called after an employee changed their own password, to tell them. Must not throw and must not be waited on. */
  onPasswordChanged: (user: { name: string; email: string }) => void;
  /** Mail 1 of an email change: sent to the employee's CURRENT address, asking them to approve. Same contract as above. */
  onEmailChangeRequested: (change: { name: string; currentEmail: string; newEmail: string; link: string }) => void;
  /** Mail 2: sent to the NEW address once the old one approved. */
  onEmailChangeConfirmation: (change: { name: string; newEmail: string; link: string }) => void;
  /** After the change is complete: a notice to the OLD address. */
  onEmailChanged: (change: { name: string; previousEmail: string; newEmail: string }) => void;
  /** Sent when a password reset is requested for an employee. Same contract as above. */
  onPasswordResetRequested: (data: { name: string; email: string; link: string }) => void;
  /** Called after an employee's password was reset via token. Sends the same password-changed notice. */
  onPasswordResetCompleted: (user: { name: string; email: string }) => void;
}

export const AUTH_BASE_PATH = "/api/v1/auth";

/**
 * Where the two email-change links and password-reset link land in the admin. They are fixed paths, set by the server, so a
 * link can never redirect anywhere else; the Account and Reset Password pages read the query to say what happened.
 */
export const EMAIL_APPROVED_PATH = "/account?email=approved";
export const EMAIL_CHANGED_PATH = "/account?email=changed";
export const RESET_PASSWORD_PATH = "/reset-password";

/** The same link with its landing page replaced (Better Auth would otherwise send both links to the same page). */
function withLanding(link: string, path: string): string {
  const url = new URL(link);
  url.searchParams.set("callbackURL", path);
  return url.toString();
}

/** The user in a Better Auth success response (`{ user: { id, name, email } }`), or null when the response has another shape. */
function userOf(returned: unknown): { id: string; name: string; email: string } | null {
  if (typeof returned !== "object" || returned === null || !("user" in returned)) return null;
  const user = (returned as { user?: { id?: unknown; name?: unknown; email?: unknown } }).user;
  if (typeof user?.id !== "string" || typeof user.name !== "string" || typeof user.email !== "string") return null;
  return { id: user.id, name: user.name, email: user.email };
}

// Better Auth 1.x is published as ESM only and this backend is compiled to CommonJS, so it is loaded with a dynamic import().
// Jest needs `--experimental-vm-modules` for that (see the `test` script).
export async function createAuth(settings: AuthSettings) {
  const [{ betterAuth }, { drizzleAdapter }, { APIError, createAuthMiddleware, getSessionFromCtx }] = await Promise.all([
    import("better-auth"),
    import("better-auth/adapters/drizzle"),
    import("better-auth/api"),
  ]);

  /**
   * True when a `/verify-email` call ended well: a redirect without an `error` parameter, or a JSON `{ status: true }`.
   * A redirect reaches the hook as an error-shaped object that is not an `instanceof` Better Auth's `APIError`, so it is read by shape.
   */
  const verifySucceeded = (returned: unknown): boolean => {
    if (typeof returned !== "object" || returned === null) return false;
    const { headers, status } = returned as { headers?: unknown; status?: unknown };
    if (headers instanceof Headers) {
      const location = headers.get("location");
      return location !== null && !new URL(location, "http://admin.invalid").searchParams.has("error");
    }
    return status === true;
  };

  // Sign-in is the only public attack surface, so it gets tighter limits (per client address).
  const tight = { window: 60, max: 10 };

  // 60-second in-memory cooldown per address to prevent flooding an inbox (ACCOUNT_PLAN.md 4.3).
  const resetCooldowns = new Map<string, number>();
  const pruneCooldowns = (now: number) => {
    if (resetCooldowns.size > 500) {
      for (const [key, timestamp] of resetCooldowns.entries()) {
        if (now - timestamp > 60_000) resetCooldowns.delete(key);
      }
    }
  };

  return betterAuth({
    appName: "AWTOMATIG",
    secret: settings.secret,
    baseURL: settings.baseURL,
    basePath: AUTH_BASE_PATH,
    trustedOrigins: settings.trustedOrigins,
    database: drizzleAdapter(settings.db, {
      provider: "pg",
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    emailAndPassword: {
      enabled: true,
      // Employees are created by an administrator (or the seed), never by the public.
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 3600,
      sendResetPassword: ({ user, url }) => {
        const now = Date.now();
        pruneCooldowns(now);
        const last = resetCooldowns.get(user.email.toLowerCase());
        if (last && now - last < 60_000) {
          return Promise.resolve();
        }
        resetCooldowns.set(user.email.toLowerCase(), now);
        settings.onPasswordResetRequested({
          name: user.name,
          email: user.email,
          link: withLanding(url, RESET_PASSWORD_PATH),
        });
        return Promise.resolve();
      },
      onPasswordReset: async ({ user }, request) => {
        await settings.audit({
          action: "auth.password_reset_completed",
          actorId: user.id,
          ipAddress: request?.headers?.get("x-forwarded-for") ?? undefined,
          userAgent: request?.headers?.get("user-agent") ?? undefined,
        });
        settings.onPasswordResetCompleted({ name: user.name, email: user.email });
      },
    },
    session: {
      // Absolute lifetime of a sign-in. Sessions are read from the database on every request (no cookie cache), so
      // signing someone out or removing them takes effect immediately.
      expiresIn: 60 * 60 * 12,
      updateAge: 60 * 60,
    },
    advanced: {
      cookiePrefix: "awtomatig",
      useSecureCookies: settings.baseURL.startsWith("https://"),
      // AuthController overwrites x-forwarded-for with the address Fastify resolved, so this header cannot be spoofed.
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
      database: { generateId: () => newId() },
    },
    rateLimit: {
      enabled: settings.rateLimit,
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": tight,
        "/change-password": tight,
        // Each try needs the current password, so it is guessable like a sign-in: same limit.
        "/change-email": tight,
        "/request-password-reset": tight,
        "/reset-password": tight,
      },
    },
    user: {
      changeEmail: {
        enabled: true,
        // Step 1: the current address approves. Without this callback Better Auth would send one mail to the new address only.
        sendChangeEmailConfirmation: ({ user, newEmail, url }) => {
          settings.onEmailChangeRequested({
            name: user.name,
            currentEmail: user.email,
            newEmail,
            link: withLanding(url, EMAIL_APPROVED_PATH),
          });
          return Promise.resolve();
        },
      },
    },
    emailVerification: {
      // Step 2: the new address confirms (`user.email` is the new address here). Only the change flow reaches this: the
      // public /send-verification-email endpoint is blocked below.
      sendVerificationEmail: ({ user, url }) => {
        settings.onEmailChangeConfirmation({ name: user.name, newEmail: user.email, link: withLanding(url, EMAIL_CHANGED_PATH) });
        return Promise.resolve();
      },
    },
    databaseHooks: {
      session: {
        create: {
          after: async (session) => {
            await settings.audit({
              action: "auth.sign_in",
              actorId: session.userId,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            });
          },
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // A new password equal to the current one changes nothing; say so instead of "succeeding". The employee typed both
        // values, so this answer reveals nothing.
        if (ctx.path === "/change-password") {
          const body = ctx.body as { currentPassword?: unknown; newPassword?: unknown } | undefined;
          if (typeof body?.currentPassword === "string" && body.currentPassword === body.newPassword) {
            throw APIError.from("BAD_REQUEST", {
              code: "PASSWORD_UNCHANGED",
              message: "The new password must be different from the current one.",
            });
          }
          return;
        }

        // Not used: it would send a "confirm your new email" mail to any address a caller names.
        if (ctx.path === "/send-verification-email") {
          throw APIError.from("NOT_FOUND", { code: "NOT_AVAILABLE", message: "Not available." });
        }

        // Better Auth's own /change-email asks for a session only. A stolen session could start a change, so the current
        // password is made mandatory here, before anything else happens (ACCOUNT_PLAN.md 4.2). Without a session the endpoint
        // answers 401 by itself.
        if (ctx.path === "/change-email") {
          const session = await getSessionFromCtx(ctx).catch(() => null);
          if (!session) return;
          const refuse = async (code: string, message: string): Promise<never> => {
            // An error thrown from a `before` hook never reaches the `after` hook, so the refusal is audited here.
            await settings.audit({
              action: "auth.email_change_failed",
              actorId: session.user.id,
              ipAddress: ctx.headers?.get("x-forwarded-for"),
              userAgent: ctx.headers?.get("user-agent"),
              metadata: { reason: code },
            });
            throw APIError.from("BAD_REQUEST", { code, message });
          };
          // An unverified address would get Better Auth's one-step flow (only the new inbox confirms). Employees are created
          // verified; anything else is refused instead of weakening the two-inbox rule.
          if (!session.user.emailVerified) {
            return refuse("EMAIL_CHANGE_UNAVAILABLE", "Your account cannot change its email here. Contact an administrator.");
          }
          const given = (ctx.body as { currentPassword?: unknown } | undefined)?.currentPassword;
          const account = await ctx.context.internalAdapter.findCredentialAccount(session.user.id);
          const correct =
            typeof given === "string" &&
            given.length > 0 &&
            given.length <= 128 &&
            typeof account?.password === "string" &&
            (await ctx.context.password.verify({ hash: account.password, password: given }));
          if (!correct) return refuse("INVALID_PASSWORD", "Invalid password");
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        const returned = ctx.context.returned;
        const request = { ipAddress: ctx.headers?.get("x-forwarded-for"), userAgent: ctx.headers?.get("user-agent") };

        if (ctx.path === "/change-password") {
          // On success the old session may already be replaced (sign out of other devices), so the actor is read from the
          // response; on failure nothing was touched and the request's own session still resolves.
          const changed = returned instanceof APIError ? null : userOf(returned);
          const actorId =
            returned instanceof APIError
              ? ((await getSessionFromCtx(ctx).catch(() => null))?.user.id ?? null)
              : (changed?.id ?? null);
          await settings.audit({
            action: returned instanceof APIError ? "auth.password_change_failed" : "auth.password_changed",
            actorId,
            ...request,
            metadata: returned instanceof APIError ? { reason: returned.body?.code ?? "UNKNOWN" } : undefined,
          });
          if (changed) settings.onPasswordChanged({ name: changed.name, email: changed.email });
          return;
        }

        if (ctx.path === "/change-email") {
          // "Requested" means the request was accepted, which is the same answer whether the address was free or already
          // taken, so the audit row reveals no more than the response does. No address is written anywhere.
          const session = await getSessionFromCtx(ctx).catch(() => null);
          await settings.audit({
            action: returned instanceof APIError ? "auth.email_change_failed" : "auth.email_change_requested",
            actorId: session?.user.id ?? null,
            ...request,
            metadata: returned instanceof APIError ? { reason: returned.body?.code ?? "UNKNOWN" } : undefined,
          });
          return;
        }

        if (ctx.path === "/verify-email") {
          // Only the second link (the new address confirming) completes a change. Its token names both addresses; it is read
          // here, after Better Auth accepted the link, to tell the OLD address what happened.
          const query = ctx.query as { token?: unknown } | undefined;
          const payload = typeof query?.token === "string" ? readSignedToken(query.token, ctx.context.secret) : null;
          if (payload?.requestType !== "change-email-verification") return;
          if (typeof payload.email !== "string" || typeof payload.updateTo !== "string") return;
          if (!verifySucceeded(returned)) return;
          const changed = await ctx.context.internalAdapter.findUserByEmail(payload.updateTo);
          if (!changed) return;
          await settings.audit({ action: "auth.email_changed", actorId: changed.user.id, ...request });
          settings.onEmailChanged({ name: changed.user.name, previousEmail: payload.email, newEmail: payload.updateTo });
          return;
        }

        if (ctx.path === "/request-password-reset") {
          await settings.audit({
            action: returned instanceof APIError ? "auth.password_reset_request_failed" : "auth.password_reset_requested",
            actorId: null,
            ...request,
            metadata: returned instanceof APIError ? { reason: returned.body?.code ?? "UNKNOWN" } : undefined,
          });
          return;
        }

        if (ctx.path === "/reset-password") {
          if (returned instanceof APIError) {
            await settings.audit({
              action: "auth.password_reset_failed",
              actorId: null,
              ...request,
              metadata: { reason: returned.body?.code ?? "UNKNOWN" },
            });
          }
          return;
        }

        const failedSteps: Record<string, string> = {
          "/sign-in/email": "password",
        };
        const step = failedSteps[ctx.path];
        if (!step || !(returned instanceof APIError)) return;
        await settings.audit({
          action: "auth.sign_in_failed",
          ...request,
          metadata: { step, reason: returned.body?.code ?? "UNKNOWN" },
        });
      }),
    },
  });
}

export type Auth = Awaited<ReturnType<typeof createAuth>>;
