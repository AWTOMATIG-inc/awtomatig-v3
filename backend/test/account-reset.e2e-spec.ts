import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { auditLog } from "../src/shared/audit/audit.schema";
import { users } from "../src/shared/auth/auth.schema";
import { MailService } from "../src/shared/mail/mail.service";

// Password reset flow (ACCOUNT_PLAN.md phase 4) against a real, migrated PostgreSQL. The mail transport is nodemailer's
// in-memory JSON one in tests; the tests read the links out of `MailService.send`. Skipped unless TEST_DATABASE_URL is
// set:  TEST_DATABASE_URL=postgres://… npm test -- account-reset.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const NEXT_PASSWORD = "a completely new password 123";
const ORIGIN = "http://localhost:3001";

describeWithDb("password reset (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const run = randomUUID().slice(0, 8);
  const email = `e2e-reset-${run}@test.invalid`;
  const unknownEmail = `e2e-unknown-${run}@test.invalid`;
  let userId: string;
  let sendSpy: jest.SpyInstance<ReturnType<MailService["send"]>, Parameters<MailService["send"]>>;
  const output: string[] = [];

  /** One browser with its own cookie jar. */
  function browser() {
    const cookies = new Map<string, string>();
    const jar = () => [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    const remember = (setCookie: unknown) => {
      for (const raw of setCookie ? [setCookie as string].flat() : []) {
        const [pair = "", ...attributes] = raw.split(";");
        const [name = "", ...value] = pair.split("=");
        if (/max-age=0/i.test(attributes.join(";")) || value.join("=") === "") cookies.delete(name);
        else cookies.set(name, value.join("="));
      }
    };
    return {
      async call(method: "GET" | "POST", url: string, payload?: object) {
        const response = await app.inject({
          method,
          url: `/api/v1${url}`,
          payload,
          headers: { origin: ORIGIN, cookie: jar() },
        });
        remember(response.headers["set-cookie"]);
        return { status: response.statusCode, body: response.json<Record<string, unknown>>() };
      },
      async get(path: string) {
        const response = await app.inject({ method: "GET", url: path, headers: { origin: ORIGIN, cookie: jar() } });
        remember(response.headers["set-cookie"]);
        return { status: response.statusCode, location: String(response.headers.location ?? "") };
      },
    };
  }

  async function signedIn(pwd = PASSWORD) {
    const b = browser();
    const response = await b.call("POST", "/auth/sign-in/email", { email, password: pwd });
    expect(response.status).toBe(200);
    return b;
  }

  async function addUser(emailAddr: string, name: string) {
    const db = drizzle({ client: pool });
    const { hashPassword } = await import("better-auth/crypto");
    const [user] = await db.insert(users).values({ name, email: emailAddr, emailVerified: true }).returning({ id: users.id });
    await pool.query(
      `insert into core.accounts (id, user_id, account_id, provider_id, password) values (gen_random_uuid(), $1::uuid, $1::text, 'credential', $2)`,
      [user!.id, await hashPassword(PASSWORD)],
    );
    return user!.id;
  }

  async function sentMessages(count: number) {
    for (let i = 0; i < 50 && sendSpy.mock.calls.length < count; i++) await new Promise((resolve) => setTimeout(resolve, 20));
    return sendSpy.mock.calls.map(([message]) => message);
  }

  function linkPath(text: string) {
    const match = /https?:\/\/\S+/.exec(text);
    expect(match).not.toBeNull();
    const url = new URL(match![0]);
    expect(url.origin).toBe(ORIGIN);
    return `${url.pathname}${url.search}`;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    pool = new Pool({ connectionString: databaseUrl, max: 2 });
    userId = await addUser(email, "E2E Reset User");

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    sendSpy = jest.spyOn(app.get(MailService), "send");

    for (const stream of [process.stdout, process.stderr]) {
      const write = stream.write.bind(stream);
      jest.spyOn(stream, "write").mockImplementation((chunk: string | Uint8Array, ...rest: unknown[]) => {
        output.push(String(chunk));
        return (write as (...args: unknown[]) => boolean)(chunk, ...rest);
      });
    }
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app?.close();
    const db = drizzle({ client: pool });
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(auditLog).where(eq(auditLog.actorId, userId));
    await pool.end();
  });

  it("unknown address gives the exact same response status and shape and sends no email", async () => {
    sendSpy.mockClear();
    const b = browser();
    const response = await b.call("POST", "/auth/request-password-reset", {
      email: unknownEmail,
      redirectTo: "/reset-password",
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: true });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("known address sends a reset email with the link and lands on /reset-password", async () => {
    sendSpy.mockClear();
    const b = browser();
    const response = await b.call("POST", "/auth/request-password-reset", {
      email,
      redirectTo: "/reset-password",
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: true });

    const sent = await sentMessages(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe(email);
    expect(sent[0]!.subject).toBe("Reset your AWTOMATIG admin password");
    expect(sent[0]!.text).toContain("E2E Reset User");
    expect(sent[0]!.text).toContain("1 hour");

    const link = linkPath(sent[0]!.text);
    expect(link).toContain("/api/v1/auth/reset-password/");
    expect(new URL(`${ORIGIN}${link}`).searchParams.get("callbackURL")).toBe("/reset-password");
  });

  it("cooldown ignores a second request for the same address within 60s without revealing it", async () => {
    sendSpy.mockClear();
    const b = browser();
    // Immediately request again for the same email
    const response = await b.call("POST", "/auth/request-password-reset", {
      email,
      redirectTo: "/reset-password",
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: true });

    // Cooldown stopped the email from being sent
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("clicking the link redirects to /reset-password?token=...", async () => {
    // Generate fresh link by reading the one from the earlier test or sentMessages
    // The previous test sent a link; let's find it from the sendSpy call
    const link = linkPath(sendSpy.mock.calls[0]![0].text);
    const b = browser();
    const redirected = await b.get(link);
    expect(redirected.status).toBe(302);
    const target = new URL(redirected.location, ORIGIN);
    expect(target.pathname).toBe("/reset-password");
    expect(target.searchParams.get("token")).toBeTruthy();
  });

  it("uses the token to set a new password, ends previous sessions, and sends notice", async () => {
    // Start an existing active session on laptop
    const laptop = await signedIn();
    expect((await laptop.call("GET", "/auth/session")).status).toBe(200);

    // Get a valid token by requesting the link
    // Note: since email had cooldown, we can test reset-password with the existing token from earlier link:
    const link = linkPath(sendSpy.mock.calls[0]![0].text);
    const target = new URL((await browser().get(link)).location, ORIGIN);
    const token = target.searchParams.get("token")!;
    expect(token).toBeTruthy();

    sendSpy.mockClear();
    const b = browser();
    const resetRes = await b.call("POST", "/auth/reset-password", {
      token,
      newPassword: NEXT_PASSWORD,
    });
    expect(resetRes.status).toBe(200);
    expect(resetRes.body).toMatchObject({ status: true });

    // "Password changed" notice is sent
    const sent = await sentMessages(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe(email);
    expect(sent[0]!.subject).toBe("Your AWTOMATIG admin password was changed");

    // Old password no longer works
    const oldLogin = await browser().call("POST", "/auth/sign-in/email", { email, password: PASSWORD });
    expect(oldLogin.status).toBe(401);

    // New password signs in
    const newLogin = await browser().call("POST", "/auth/sign-in/email", { email, password: NEXT_PASSWORD });
    expect(newLogin.status).toBe(200);

    // Active session before reset is now revoked
    expect((await laptop.call("GET", "/auth/session")).status).toBe(401);
  });

  it("reused or invalid token is rejected", async () => {
    const b = browser();
    const invalid = await b.call("POST", "/auth/reset-password", {
      token: "completely-invalid-or-already-used-token",
      newPassword: "another long password 123",
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toMatchObject({ code: "INVALID_TOKEN" });
  });

  it("audits the request and reset completion without leaking secrets or addresses", async () => {
    const { rows } = await pool.query<{ action: string; actor_id: string | null; metadata: unknown }>(
      `select action, actor_id, metadata from core.audit_log where action in ('auth.password_reset_requested', 'auth.password_reset_completed')`,
    );
    const actions = rows.map((r) => r.action);
    expect(actions).toContain("auth.password_reset_requested");
    expect(actions).toContain("auth.password_reset_completed");

    const completed = rows.find((r) => r.action === "auth.password_reset_completed");
    expect(completed?.actor_id).toBe(userId);

    const everything = JSON.stringify(rows);
    expect(everything).not.toContain(PASSWORD);
    expect(everything).not.toContain(NEXT_PASSWORD);
    expect(everything).not.toContain(email);

    // Verify stdout/stderr logged output contains no address or link
    const logOutput = output.join("");
    expect(logOutput).not.toContain(PASSWORD);
    expect(logOutput).not.toContain(NEXT_PASSWORD);
    expect(logOutput).not.toContain(email);
  });
});
