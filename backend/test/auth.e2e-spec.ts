import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { auditLog } from "../src/shared/audit/audit.schema";
import { users } from "../src/shared/auth/auth.schema";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";

// Sign-in and sessions against a real, migrated PostgreSQL (backend/RULES.md section 6). It creates
// its own users and removes them afterwards. Skipped unless TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://… npm test -- auth.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";

describeWithDb("authentication (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const email = `e2e-${randomUUID()}@test.invalid`;
  const roleName = `e2e-${randomUUID()}`;
  let userId: string;

  /** A tiny cookie jar: what a browser would keep between calls. */
  const cookies = new Map<string, string>();
  async function call(method: "GET" | "POST", url: string, payload?: object, headers: Record<string, string> = {}) {
    const response = await app.inject({
      method,
      url: `/api/v1${url}`,
      payload,
      headers: { origin: ORIGIN, cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "), ...headers },
    });
    for (const raw of response.headers["set-cookie"] ? [response.headers["set-cookie"]].flat() : []) {
      const [pair = "", ...attributes] = raw.split(";");
      const [name = "", ...value] = pair.split("=");
      if (/max-age=0/i.test(attributes.join(";")) || value.join("=") === "") cookies.delete(name);
      else cookies.set(name, value.join("="));
    }
    return { status: response.statusCode, body: response.json<Record<string, unknown>>(), headers: response.headers };
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    pool = new Pool({ connectionString: databaseUrl, max: 2 });
    const db = drizzle({ client: pool });
    const { hashPassword } = await import("better-auth/crypto");

    const [user] = await db.insert(users).values({ name: "E2E User", email, emailVerified: true }).returning({ id: users.id });
    userId = user!.id;
    await pool.query(
      `insert into core.accounts (id, user_id, account_id, provider_id, password) values (gen_random_uuid(), $1::uuid, $1::text, 'credential', $2)`,
      [userId, await hashPassword(PASSWORD)],
    );
    const [role] = await db.insert(roles).values({ name: roleName }).returning({ id: roles.id });
    await db.insert(rolePermissions).values({ roleId: role!.id, permission: "crm.lead.read" });
    await db.insert(userRoles).values({ userId, roleId: role!.id });

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    await db.delete(users).where(eq(users.email, email));
    await db.delete(roles).where(eq(roles.name, roleName));
    await db.delete(auditLog).where(eq(auditLog.actorId, userId));
    await pool.end();
  });

  it("answers 401 in the single error shape without a session", async () => {
    const response = await call("GET", "/auth/session");
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ code: "UNAUTHORIZED", message: "Authentication is required" });
  });

  it("rejects a wrong password with a message that does not reveal whether the email exists", async () => {
    const wrong = await call("POST", "/auth/sign-in/email", { email, password: "not the password at all" });
    const unknown = await call("POST", "/auth/sign-in/email", {
      email: "nobody@test.invalid",
      password: "not the password at all",
    });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  // The cross-origin check (403 INVALID_ORIGIN) is switched off by Better Auth when NODE_ENV=test, so it is covered by hand, not here.
  it("keeps sign-up closed", async () => {
    const signUp = await call("POST", "/auth/sign-up/email", { email: "new@test.invalid", password: PASSWORD, name: "New" });
    expect(signUp.status).toBe(400);
  });

  it("signs in with an httpOnly cookie, reads the session, and signs out", async () => {
    const signIn = await call("POST", "/auth/sign-in/email", { email, password: PASSWORD });
    expect(signIn.status).toBe(200);
    const cookie = [signIn.headers["set-cookie"]].flat().join(";");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const session = await call("GET", "/auth/session");
    expect(session.status).toBe(200);
    expect(session.body).toMatchObject({ roles: [roleName], permissions: ["crm.lead.read"] });

    expect((await call("POST", "/auth/sign-out", {})).status).toBe(200);
    expect((await call("GET", "/auth/session")).status).toBe(401);
  });

  it("writes sign-ins and failures to the audit log, without the email or password", async () => {
    const { rows } = await pool.query<{ action: string; metadata: unknown }>(
      `select action, metadata from core.audit_log where actor_id = $1 or action = 'auth.sign_in_failed'`,
      [userId],
    );
    const actions = rows.map((row) => row.action);
    expect(actions).toContain("auth.sign_in");
    expect(actions).toContain("auth.sign_in_failed");
    expect(JSON.stringify(rows)).not.toContain(PASSWORD);
    expect(JSON.stringify(rows)).not.toContain(email);
  });
});
