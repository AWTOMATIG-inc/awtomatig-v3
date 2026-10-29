import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { users } from "../src/shared/auth/auth.schema";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";

// The CRM endpoints against a real, migrated PostgreSQL (backend/RULES.md section 6). It creates its own users, roles and leads
// and removes them afterwards. Skipped unless TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://… npm test -- crm.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";
const INGEST = { "x-ingest-key": process.env.LEAD_INGEST_KEY ?? "" };
const RUN = randomUUID().slice(0, 8);

describeWithDb("CRM leads (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const staffEmail = `e2e-staff-${RUN}@test.invalid`;
  const guestEmail = `e2e-guest-${RUN}@test.invalid`;
  const roleNames = [`e2e-crm-${RUN}`, `e2e-none-${RUN}`];
  const leadName = `E2E Lead ${RUN}`;
  const submissionId = randomUUID();
  let leadId: string;
  let staffCookie = "";
  let guestCookie = "";

  const lead = (patch: Record<string, unknown> = {}) => ({
    submissionId,
    name: leadName,
    email: `Visitor-${RUN}@Example.com`,
    company: "E2E Co",
    budget: "$5k – $15k",
    helpWith: "Web development",
    projectType: "New project",
    message: "Please call us about 100% of the roadmap_v2.",
    consent: true,
    ...patch,
  });

  const api = (
    method: "GET" | "POST" | "PATCH",
    url: string,
    options: { payload?: object; headers?: Record<string, string> } = {},
  ) => app.inject({ method, url: `/api/v1${url}`, payload: options.payload, headers: options.headers });

  async function signIn(email: string): Promise<string> {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/sign-in/email",
      payload: { email, password: PASSWORD },
      headers: { origin: ORIGIN },
    });
    expect(response.statusCode).toBe(200);
    return [response.headers["set-cookie"]]
      .flat()
      .map((cookie) => String(cookie).split(";")[0])
      .join("; ");
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    pool = new Pool({ connectionString: databaseUrl, max: 2 });
    const db = drizzle({ client: pool });
    const { hashPassword } = await import("better-auth/crypto");
    const hash = await hashPassword(PASSWORD);

    const makeUser = async (email: string, roleName: string, permissions: string[]) => {
      const [user] = await db
        .insert(users)
        .values({ name: `E2E ${email}`, email, emailVerified: true })
        .returning({ id: users.id });
      await pool.query(
        `insert into core.accounts (id, user_id, account_id, provider_id, password) values (gen_random_uuid(), $1::uuid, $1::text, 'credential', $2)`,
        [user!.id, hash],
      );
      const [role] = await db.insert(roles).values({ name: roleName }).returning({ id: roles.id });
      if (permissions.length > 0)
        await db.insert(rolePermissions).values(permissions.map((permission) => ({ roleId: role!.id, permission })));
      await db.insert(userRoles).values({ userId: user!.id, roleId: role!.id });
    };
    await makeUser(staffEmail, roleNames[0]!, ["crm.lead.read", "crm.lead.update"]);
    await makeUser(guestEmail, roleNames[1]!, ["inventory.stock.read"]);

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    staffCookie = await signIn(staffEmail);
    guestCookie = await signIn(guestEmail);
  });

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    // Only this run's rows: the other e2e suites share the database and run in parallel.
    await pool.query(`delete from core.audit_log where entity_id in (select id::text from crm.leads where name = $1)`, [
      leadName,
    ]);
    await pool.query(`delete from crm.leads where name = $1`, [leadName]);
    await db.delete(users).where(like(users.email, `e2e-%-${RUN}@test.invalid`));
    for (const name of roleNames) await db.delete(roles).where(eq(roles.name, name));
    await pool.end();
  });

  describe("capturing a lead from the website", () => {
    it("needs the shared ingest key", async () => {
      expect((await api("POST", "/crm/leads", { payload: lead() })).statusCode).toBe(401);
      expect((await api("POST", "/crm/leads", { payload: lead(), headers: { "x-ingest-key": "wrong" } })).statusCode).toBe(401);
    });

    it("rejects missing consent, a bad email and an empty message", async () => {
      for (const patch of [{ consent: false }, { email: "nope" }, { message: "  " }]) {
        const response = await api("POST", "/crm/leads", { payload: lead(patch), headers: INGEST });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ code: "VALIDATION_FAILED" });
      }
    });

    it("stores the lead, and a retry with the same submission id adds nothing", async () => {
      const first = await api("POST", "/crm/leads", { payload: lead(), headers: INGEST });
      expect(first.statusCode).toBe(201);
      leadId = first.json<{ id: string }>().id;

      const retry = await api("POST", "/crm/leads", { payload: lead(), headers: INGEST });
      expect(retry.statusCode).toBe(201);
      expect(retry.json()).toEqual({ id: leadId });

      const { rows } = await pool.query<{ n: number }>(`select count(*)::int as n from crm.leads where submission_id = $1`, [
        submissionId,
      ]);
      expect(rows[0]?.n).toBe(1);
    });

    it("keeps the visitor's details out of the audit log", async () => {
      const { rows } = await pool.query<{ action: string }>(`select action, metadata from core.audit_log where entity_id = $1`, [
        leadId,
      ]);
      expect(rows.map((row) => row.action)).toContain("crm.lead.captured");
      expect(JSON.stringify(rows)).not.toContain("example.com");
      expect(JSON.stringify(rows)).not.toContain(leadName);
    });
  });

  describe("reading leads in the admin", () => {
    it("needs a session and the crm.lead.read permission", async () => {
      expect((await api("GET", "/crm/leads")).statusCode).toBe(401);
      expect((await api("GET", "/crm/leads", { headers: { cookie: guestCookie } })).statusCode).toBe(403);
      expect((await api("GET", `/crm/leads/${leadId}`, { headers: { cookie: guestCookie } })).statusCode).toBe(403);
    });

    it("lists with search, status filter and paging, never returning the message in the list", async () => {
      const found = await api("GET", `/crm/leads?q=${encodeURIComponent(leadName)}&pageSize=5`, {
        headers: { cookie: staffCookie },
      });
      expect(found.statusCode).toBe(200);
      const body = found.json<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }>();
      expect(body).toMatchObject({ total: 1, page: 1, pageSize: 5 });
      expect(body.items[0]).toMatchObject({ id: leadId, name: leadName, email: `visitor-${RUN}@example.com`, status: "new" });
      expect(body.items[0]).not.toHaveProperty("message");

      const wrongStatus = await api("GET", `/crm/leads?q=${encodeURIComponent(leadName)}&status=won`, {
        headers: { cookie: staffCookie },
      });
      expect(wrongStatus.json()).toMatchObject({ total: 0, items: [] });
    });

    it("treats % and _ in a search as plain characters", async () => {
      const response = await api("GET", `/crm/leads?q=${encodeURIComponent("E2E Lead %")}`, { headers: { cookie: staffCookie } });
      expect(response.json()).toMatchObject({ total: 0 });
    });

    it("returns one lead with its message, and answers 404 / 400 for a bad id", async () => {
      const response = await api("GET", `/crm/leads/${leadId}`, { headers: { cookie: staffCookie } });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ id: string; message: string; notes: string }>();
      expect(body.id).toBe(leadId);
      expect(body.message).toContain("100% of the roadmap_v2");
      expect(body.notes).toBe("");

      expect((await api("GET", `/crm/leads/${randomUUID()}`, { headers: { cookie: staffCookie } })).statusCode).toBe(404);
      expect((await api("GET", `/crm/leads/not-a-uuid`, { headers: { cookie: staffCookie } })).statusCode).toBe(400);
    });
  });

  describe("working a lead", () => {
    it("changes the status and notes, and records who did it", async () => {
      const response = await api("PATCH", `/crm/leads/${leadId}`, {
        payload: { status: "contacted", notes: "Called on Monday." },
        headers: { cookie: staffCookie },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ status: "contacted", notes: "Called on Monday." });

      const { rows } = await pool.query<{ actor_id: string | null; metadata: unknown }>(
        `select actor_id, metadata from core.audit_log where entity_id = $1 and action = 'crm.lead.updated'`,
        [leadId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.actor_id).not.toBeNull();
      expect(rows[0]?.metadata).toMatchObject({ status: "contacted" });
      expect(JSON.stringify(rows)).not.toContain("Called on Monday");
    });

    it("clears the notes with an empty string, and rejects an empty change or a bad status", async () => {
      const cleared = await api("PATCH", `/crm/leads/${leadId}`, { payload: { notes: "" }, headers: { cookie: staffCookie } });
      expect(cleared.json()).toMatchObject({ notes: "", status: "contacted" });
      expect((await api("PATCH", `/crm/leads/${leadId}`, { payload: {}, headers: { cookie: staffCookie } })).statusCode).toBe(
        400,
      );
      expect(
        (await api("PATCH", `/crm/leads/${leadId}`, { payload: { status: "archived" }, headers: { cookie: staffCookie } }))
          .statusCode,
      ).toBe(400);
    });

    it("needs the crm.lead.update permission", async () => {
      const response = await api("PATCH", `/crm/leads/${leadId}`, {
        payload: { status: "won" },
        headers: { cookie: guestCookie },
      });
      expect(response.statusCode).toBe(403);
    });
  });

  describe("dashboard figures", () => {
    it("returns counts, a zero-filled series and recent activity", async () => {
      const response = await api("GET", "/crm/leads/stats?days=30&timeZone=Asia/Dhaka", { headers: { cookie: staffCookie } });
      expect(response.statusCode).toBe(200);
      const stats = response.json<{
        bucket: string;
        inRange: number;
        open: number;
        series: { start: string; count: number }[];
        activity: { actor: string; action: string }[];
      }>();
      expect(stats.bucket).toBe("week");
      expect(stats.series).toHaveLength(5);
      expect(stats.inRange).toBeGreaterThanOrEqual(1);
      expect(stats.open).toBeGreaterThanOrEqual(1);
      expect(stats.series.reduce((sum, point) => sum + point.count, 0)).toBeGreaterThanOrEqual(1);
      expect(stats.activity.map((entry) => entry.action)).toEqual(
        expect.arrayContaining([`Inquiry received from ${leadName}`, `Marked ${leadName} as Contacted`]),
      );
    });

    it("uses one bar per day for a week and rejects a bad time zone", async () => {
      const week = await api("GET", "/crm/leads/stats?days=7", { headers: { cookie: staffCookie } });
      const weekStats = week.json<{ bucket: string; series: unknown[] }>();
      expect(weekStats.bucket).toBe("day");
      expect(weekStats.series).toHaveLength(7);
      expect((await api("GET", "/crm/leads/stats?timeZone=Mars/Olympus", { headers: { cookie: staffCookie } })).statusCode).toBe(
        400,
      );
    });
  });
});
