import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { auditLog } from "../src/shared/audit/audit.schema";
import { users } from "../src/shared/auth/auth.schema";
import { MailUnavailableError } from "../src/shared/mail/mail.errors";
import { MailService } from "../src/shared/mail/mail.service";

// An employee changing their own password (ACCOUNT_PLAN.md phases 1 and 2) against a real, migrated PostgreSQL. The mail transport is
// nodemailer's in-memory JSON one in tests, so nothing is sent; the tests watch `MailService.send`. Skipped unless
// TEST_DATABASE_URL is set:  TEST_DATABASE_URL=postgres://… npm test -- account.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";

describeWithDb("change password (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const email = `e2e-${randomUUID()}@test.invalid`;
  let userId: string;
  // The password the account has right now; every test that changes it updates this.
  let current = PASSWORD;
  let sendSpy: jest.SpyInstance<ReturnType<MailService["send"]>, Parameters<MailService["send"]>>;

  /** One browser: its own cookie jar, so two of them are two devices. */
  function browser() {
    const cookies = new Map<string, string>();
    return async function call(method: "GET" | "POST", url: string, payload?: object) {
      const response = await app.inject({
        method,
        url: `/api/v1${url}`,
        payload,
        headers: { origin: ORIGIN, cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; ") },
      });
      for (const raw of response.headers["set-cookie"] ? [response.headers["set-cookie"]].flat() : []) {
        const [pair = "", ...attributes] = raw.split(";");
        const [name = "", ...value] = pair.split("=");
        if (/max-age=0/i.test(attributes.join(";")) || value.join("=") === "") cookies.delete(name);
        else cookies.set(name, value.join("="));
      }
      return { status: response.statusCode, body: response.json<Record<string, unknown>>() };
    };
  }

  async function signedIn() {
    const call = browser();
    const response = await call("POST", "/auth/sign-in/email", { email, password: current });
    expect(response.status).toBe(200);
    return call;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    pool = new Pool({ connectionString: databaseUrl, max: 2 });
    const db = drizzle({ client: pool });
    const { hashPassword } = await import("better-auth/crypto");

    const [user] = await db.insert(users).values({ name: "E2E Account", email, emailVerified: true }).returning({ id: users.id });
    userId = user!.id;
    await pool.query(
      `insert into core.accounts (id, user_id, account_id, provider_id, password) values (gen_random_uuid(), $1::uuid, $1::text, 'credential', $2)`,
      [userId, await hashPassword(PASSWORD)],
    );

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    sendSpy = jest.spyOn(app.get(MailService), "send");
  });

  /** Notices go out in the background, so wait for the call instead of assuming it already happened. */
  async function sentMessages(count: number) {
    for (let i = 0; i < 50 && sendSpy.mock.calls.length < count; i++) await new Promise((resolve) => setTimeout(resolve, 20));
    return sendSpy.mock.calls.map(([message]) => message);
  }

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    await db.delete(users).where(eq(users.email, email));
    await db.delete(auditLog).where(eq(auditLog.actorId, userId));
    await pool.end();
  });

  it("needs a session", async () => {
    const response = await browser()("POST", "/auth/change-password", { currentPassword: current, newPassword: "x".repeat(14) });
    expect(response.status).toBe(401);
  });

  it("refuses a wrong current password and leaves the password alone", async () => {
    const call = await signedIn();
    const response = await call("POST", "/auth/change-password", {
      currentPassword: "not the current password",
      newPassword: "a brand new passphrase 1",
    });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: "INVALID_PASSWORD" });
    // The old password still signs in.
    await signedIn();
  });

  it("refuses a new password equal to the current one", async () => {
    const call = await signedIn();
    const response = await call("POST", "/auth/change-password", { currentPassword: current, newPassword: current });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: "PASSWORD_UNCHANGED" });
  });

  it("refuses a password that is too short or too long", async () => {
    const call = await signedIn();
    const short = await call("POST", "/auth/change-password", { currentPassword: current, newPassword: "short" });
    expect(short.status).toBe(400);
    expect(short.body).toMatchObject({ code: "PASSWORD_TOO_SHORT" });
    const long = await call("POST", "/auth/change-password", { currentPassword: current, newPassword: "x".repeat(129) });
    expect(long.status).toBe(400);
    expect(long.body).toMatchObject({ code: "PASSWORD_TOO_LONG" });
  });

  it("changes the password and keeps other devices signed in when not asked to end them", async () => {
    const laptop = await signedIn();
    const phone = await signedIn();
    const next = "another long passphrase 2";

    const response = await laptop("POST", "/auth/change-password", {
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: false,
    });
    expect(response.status).toBe(200);
    const old = current;
    current = next;

    expect((await laptop("GET", "/auth/session")).status).toBe(200);
    expect((await phone("GET", "/auth/session")).status).toBe(200);

    // The old password no longer signs in; the new one does.
    const stale = await browser()("POST", "/auth/sign-in/email", { email, password: old });
    expect(stale.status).toBe(401);
    await signedIn();
  });

  it("ends the other devices when asked to, and keeps this one signed in", async () => {
    const laptop = await signedIn();
    const phone = await signedIn();
    const next = "yet another long passphrase 3";

    const response = await laptop("POST", "/auth/change-password", {
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    expect(response.status).toBe(200);
    current = next;

    expect((await laptop("GET", "/auth/session")).status).toBe(200);
    expect((await phone("GET", "/auth/session")).status).toBe(401);
  });

  it("emails the employee a notice after a change, with no password in it", async () => {
    sendSpy.mockClear();
    const call = await signedIn();
    const old = current;
    const next = "a fourth long passphrase 4";
    expect((await call("POST", "/auth/change-password", { currentPassword: old, newPassword: next })).status).toBe(200);
    current = next;

    const sent = await sentMessages(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: email, subject: "Your AWTOMATIG admin password was changed" });
    expect(sent[0]?.text).toContain("E2E Account");
    expect(JSON.stringify(sent)).not.toContain(old);
    expect(JSON.stringify(sent)).not.toContain(next);
  });

  it("sends no email for an attempt that failed", async () => {
    sendSpy.mockClear();
    const call = await signedIn();
    await call("POST", "/auth/change-password", {
      currentPassword: "not the current password",
      newPassword: "a brand new passphrase 1",
    });
    await call("POST", "/auth/change-password", { currentPassword: current, newPassword: current });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("still changes the password, with the same answer, when the mail server is down", async () => {
    sendSpy.mockClear();
    sendSpy.mockRejectedValueOnce(new MailUnavailableError());
    const call = await signedIn();
    const next = "a fifth long passphrase 5";
    const response = await call("POST", "/auth/change-password", { currentPassword: current, newPassword: next });
    expect(response.status).toBe(200);
    current = next;
    await sentMessages(1);
    await signedIn();
  });

  it("audits the attempts without the email or any password", async () => {
    const { rows } = await pool.query<{ action: string; metadata: unknown }>(
      `select action, metadata from core.audit_log where actor_id = $1 and action like 'auth.password_%'`,
      [userId],
    );
    const actions = rows.map((row) => row.action);
    expect(actions).toContain("auth.password_changed");
    expect(actions).toContain("auth.password_change_failed");
    const failedReasons = rows.filter((row) => row.action === "auth.password_change_failed").map((row) => row.metadata);
    expect(failedReasons).toEqual(expect.arrayContaining([{ reason: "INVALID_PASSWORD" }]));

    const everything = JSON.stringify(rows);
    for (const secret of [
      PASSWORD,
      "another long passphrase 2",
      "yet another long passphrase 3",
      "a fourth long passphrase 4",
      "a fifth long passphrase 5",
      "a brand new passphrase 1",
      email,
    ]) {
      expect(everything).not.toContain(secret);
    }
  });
});
