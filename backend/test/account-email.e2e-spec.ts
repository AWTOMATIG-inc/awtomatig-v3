import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { auditLog } from "../src/shared/audit/audit.schema";
import { users } from "../src/shared/auth/auth.schema";
import { MailService } from "../src/shared/mail/mail.service";

// An employee changing their own sign-in email (ACCOUNT_PLAN.md phase 3) against a real, migrated PostgreSQL. The mail transport is
// nodemailer's in-memory JSON one in tests; the tests read the links out of `MailService.send`. Skipped unless TEST_DATABASE_URL is
// set:  TEST_DATABASE_URL=postgres://… npm test -- account-email.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";

describeWithDb("change email (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const run = randomUUID().slice(0, 8);
  // `current` is the address the main employee signs in with right now; the flow changes it.
  let current = `e2e-mail-${run}@test.invalid`;
  const takenEmail = `e2e-taken-${run}@test.invalid`;
  const unverifiedEmail = `e2e-unverified-${run}@test.invalid`;
  const freshEmail = `e2e-new-${run}@test.invalid`;
  const otherFresh = `e2e-other-${run}@test.invalid`;
  let userId: string;
  const ids: string[] = [];
  let sendSpy: jest.SpyInstance<ReturnType<MailService["send"]>, Parameters<MailService["send"]>>;
  const output: string[] = [];

  /** One browser with its own cookie jar. `get` is a raw GET (a link clicked from an email). */
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

  async function signedIn(email = current) {
    const b = browser();
    const response = await b.call("POST", "/auth/sign-in/email", { email, password: PASSWORD });
    expect(response.status).toBe(200);
    return b;
  }

  async function addUser(email: string, name: string, emailVerified: boolean) {
    const db = drizzle({ client: pool });
    const { hashPassword } = await import("better-auth/crypto");
    const [user] = await db.insert(users).values({ name, email, emailVerified }).returning({ id: users.id });
    ids.push(user!.id);
    await pool.query(
      `insert into core.accounts (id, user_id, account_id, provider_id, password) values (gen_random_uuid(), $1::uuid, $1::text, 'credential', $2)`,
      [user!.id, await hashPassword(PASSWORD)],
    );
    return user!.id;
  }

  /** Mail goes out in the background, so wait for the calls instead of assuming they already happened. */
  async function sentMessages(count: number) {
    for (let i = 0; i < 50 && sendSpy.mock.calls.length < count; i++) await new Promise((resolve) => setTimeout(resolve, 20));
    return sendSpy.mock.calls.map(([message]) => message);
  }
  async function settle() {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  /** The link in a message, as the path a browser would request from the admin's origin. */
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
    userId = await addUser(current, "E2E Email", true);
    await addUser(takenEmail, "E2E Taken", true);
    await addUser(unverifiedEmail, "E2E Unverified", false);

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    sendSpy = jest.spyOn(app.get(MailService), "send");

    // Everything the process prints during these tests, to prove no address or link reaches a log.
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
    await db.delete(auditLog).where(inArray(auditLog.actorId, ids));
    await db.delete(users).where(inArray(users.id, ids));
    await pool.end();
  });

  it("needs a session", async () => {
    const response = await browser().call("POST", "/auth/change-email", { newEmail: freshEmail, currentPassword: PASSWORD });
    expect(response.status).toBe(401);
  });

  it("refuses a missing or wrong current password and sends nothing", async () => {
    sendSpy.mockClear();
    const b = await signedIn();
    for (const payload of [
      { newEmail: freshEmail },
      { newEmail: freshEmail, currentPassword: "" },
      { newEmail: freshEmail, currentPassword: "not the current password" },
      { newEmail: freshEmail, currentPassword: "x".repeat(500) },
    ]) {
      const response = await b.call("POST", "/auth/change-email", payload);
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ code: "INVALID_PASSWORD" });
    }
    await settle();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("refuses the address the employee already has", async () => {
    sendSpy.mockClear();
    const b = await signedIn();
    const response = await b.call("POST", "/auth/change-email", { newEmail: current, currentPassword: PASSWORD });
    expect(response.status).toBe(400);
    await settle();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("refuses an employee whose address is not verified, so the one-step flow is never used", async () => {
    sendSpy.mockClear();
    const b = await signedIn(unverifiedEmail);
    const response = await b.call("POST", "/auth/change-email", { newEmail: freshEmail, currentPassword: PASSWORD });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: "EMAIL_CHANGE_UNAVAILABLE" });
    await settle();
    expect(sendSpy).not.toHaveBeenCalled();
    const { rows } = await pool.query(`select email from core.users where email = $1`, [unverifiedEmail]);
    expect(rows).toHaveLength(1);
  });

  it("answers the same and sends nothing when the address belongs to someone else", async () => {
    sendSpy.mockClear();
    const b = await signedIn();
    const taken = await b.call("POST", "/auth/change-email", { newEmail: takenEmail, currentPassword: PASSWORD });
    await settle();
    expect(sendSpy).not.toHaveBeenCalled();

    // A free address gets the same status and body (and, below, the mail).
    const free = await b.call("POST", "/auth/change-email", { newEmail: otherFresh, currentPassword: PASSWORD });
    expect(taken).toEqual(free);
    expect(taken.status).toBe(200);
    expect(taken.body).toEqual({ status: true });
    await sentMessages(1);
    sendSpy.mockClear();
  });

  it("blocks the public verification-mail endpoint", async () => {
    sendSpy.mockClear();
    const b = await signedIn();
    const response = await b.call("POST", "/auth/send-verification-email", { email: current });
    expect(response.status).toBe(404);
    const anonymous = await browser().call("POST", "/auth/send-verification-email", { email: takenEmail });
    expect(anonymous.status).toBe(404);
    await settle();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  describe("the two-inbox flow", () => {
    let laptop: ReturnType<typeof browser>;
    let phone: ReturnType<typeof browser>;
    let approveLink = "";
    let confirmLink = "";
    const oldEmail = () => original;
    let original = "";

    it("sends the approval to the CURRENT address only, naming the new one", async () => {
      original = current;
      laptop = await signedIn();
      phone = await signedIn();
      sendSpy.mockClear();

      const response = await laptop.call("POST", "/auth/change-email", { newEmail: freshEmail, currentPassword: PASSWORD });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: true });

      const sent = await sentMessages(1);
      await settle();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sent[0]).toMatchObject({ to: oldEmail(), subject: "Approve changing your AWTOMATIG admin email" });
      expect(sent[0]?.text).toContain(freshEmail);
      expect(sent[0]?.text).not.toContain(PASSWORD);
      approveLink = linkPath(sent[0]!.text);
      expect(approveLink).toContain("/api/v1/auth/verify-email");
      expect(new URL(`${ORIGIN}${approveLink}`).searchParams.get("callbackURL")).toBe("/account?email=approved");
      // Nothing has changed yet.
      const session = await laptop.call("GET", "/auth/session");
      expect((session.body.user as { email: string }).email).toBe(oldEmail());
    });

    it("sends the confirmation to the NEW address once the first link is opened", async () => {
      sendSpy.mockClear();
      const click = await laptop.get(approveLink);
      expect(click.status).toBe(302);
      expect(click.location).toBe("/account?email=approved");

      const sent = await sentMessages(1);
      await settle();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sent[0]).toMatchObject({ to: freshEmail, subject: "Confirm your new AWTOMATIG admin email" });
      expect(sent[0]?.text).not.toContain(oldEmail());
      confirmLink = linkPath(sent[0]!.text);
      expect(new URL(`${ORIGIN}${confirmLink}`).searchParams.get("callbackURL")).toBe("/account?email=changed");

      const session = await laptop.call("GET", "/auth/session");
      expect((session.body.user as { email: string }).email).toBe(oldEmail());
    });

    it("changes the email on the second link, tells the old address, and keeps other devices signed in", async () => {
      sendSpy.mockClear();
      const click = await laptop.get(confirmLink);
      expect(click.status).toBe(302);
      expect(click.location).toBe("/account?email=changed");
      current = freshEmail;

      const sent = await sentMessages(1);
      await settle();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sent[0]).toMatchObject({ to: oldEmail(), subject: "Your AWTOMATIG admin sign-in email was changed" });
      expect(sent[0]?.text).toContain(freshEmail);

      // The live session shows the new address at once, on this device and the other.
      for (const device of [laptop, phone]) {
        const session = await device.call("GET", "/auth/session");
        expect(session.status).toBe(200);
        expect((session.body.user as { email: string }).email).toBe(freshEmail);
      }
      // The new address signs in; the old one no longer does.
      await signedIn(freshEmail);
      const stale = await browser().call("POST", "/auth/sign-in/email", { email: oldEmail(), password: PASSWORD });
      expect(stale.status).toBe(401);
    });

    it("refuses both links when they are used again, and sends no second notice", async () => {
      sendSpy.mockClear();
      for (const link of [approveLink, confirmLink]) {
        const again = await browser().get(link);
        expect(again.status).toBe(302);
        expect(new URL(again.location, ORIGIN).searchParams.get("error")).not.toBeNull();
      }
      await settle();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it("refuses a link that was not signed by the server", async () => {
      sendSpy.mockClear();
      const forged = approveLink.replace(/token=[^&]+/, "token=aaa.bbb.ccc");
      const response = await browser().get(forged);
      expect(response.status).toBe(302);
      expect(new URL(response.location, ORIGIN).searchParams.get("error")).not.toBeNull();
      await settle();
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  it("audits each step with ids only, and no address, token or password reaches the audit log or the output", async () => {
    const { rows } = await pool.query<{ action: string; metadata: unknown }>(
      `select action, metadata from core.audit_log where actor_id = $1 and action like 'auth.email_%'`,
      [userId],
    );
    const actions = rows.map((row) => row.action);
    expect(actions).toEqual(
      expect.arrayContaining(["auth.email_change_requested", "auth.email_change_failed", "auth.email_changed"]),
    );
    expect(rows.filter((row) => row.action === "auth.email_change_failed").map((row) => row.metadata)).toEqual(
      expect.arrayContaining([{ reason: "INVALID_PASSWORD" }]),
    );

    const auditText = JSON.stringify(rows);
    const printed = output.join("");
    for (const secret of [PASSWORD, takenEmail, freshEmail, otherFresh, unverifiedEmail, `e2e-mail-${run}`]) {
      expect(auditText).not.toContain(secret);
      expect(printed).not.toContain(secret);
    }
    expect(printed).not.toMatch(/verify-email\?token=/);
  });
});
