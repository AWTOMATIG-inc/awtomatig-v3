import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type { AuditEntry } from "../audit/audit.service";
import { newId } from "../db/columns";
import { accounts, sessions, users, verifications } from "./auth.schema";

export interface AuthSettings {
  db: NodePgDatabase;
  secret: string;
  /** Public origin of the admin app. */
  baseURL: string;
  trustedOrigins: string[];
  /** Turned off in tests, which sign in many times from one address. */
  rateLimit: boolean;
  audit: (entry: AuditEntry) => Promise<void>;
}

export const AUTH_BASE_PATH = "/api/v1/auth";

// Better Auth 1.x is published as ESM only and this backend is compiled to CommonJS, so it is loaded with a dynamic import().
// Jest needs `--experimental-vm-modules` for that (see the `test` script).
export async function createAuth(settings: AuthSettings) {
  const [{ betterAuth }, { drizzleAdapter }, { APIError, createAuthMiddleware }] = await Promise.all([
    import("better-auth"),
    import("better-auth/adapters/drizzle"),
    import("better-auth/api"),
  ]);

  // Sign-in is the only public attack surface, so it gets tighter limits (per client address).
  const tight = { window: 60, max: 10 };

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
      after: createAuthMiddleware(async (ctx) => {
        const failedSteps: Record<string, string> = {
          "/sign-in/email": "password",
        };
        const step = failedSteps[ctx.path];
        if (!step || !(ctx.context.returned instanceof APIError)) return;
        await settings.audit({
          action: "auth.sign_in_failed",
          ipAddress: ctx.headers?.get("x-forwarded-for"),
          userAgent: ctx.headers?.get("user-agent"),
          metadata: { step, reason: ctx.context.returned.body?.code ?? "UNKNOWN" },
        });
      }),
    },
  });
}

export type Auth = Awaited<ReturnType<typeof createAuth>>;
