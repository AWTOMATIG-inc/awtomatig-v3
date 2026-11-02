import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { users } from "../src/shared/auth/auth.schema";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";

// The job-opening endpoints against a real, migrated PostgreSQL (backend/RULES.md section 6). It creates its own users, roles and
// jobs and removes them afterwards. Skipped unless TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://… npm test -- recruitment.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";
const RUN = randomUUID().slice(0, 8);

/** A `YYYY-MM-DD` date `days` from now, in Dhaka, which is the clock the module uses. */
function dhakaDay(days: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(Date.now() + days * 86_400_000),
  );
}

interface JobBody {
  id: string;
  slug: string;
  title: string;
  status: string;
  acceptingApplications: boolean;
  deadlineOn: string;
  salaryMin: string | null;
  salaryMax: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  questions: { id: string; position: number; text: string; required: boolean }[];
}

describeWithDb("Recruitment jobs (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const staffEmail = `e2e-staff-${RUN}@test.invalid`;
  const guestEmail = `e2e-guest-${RUN}@test.invalid`;
  const readerEmail = `e2e-reader-${RUN}@test.invalid`;
  const roleNames = [`e2e-rec-${RUN}`, `e2e-none-${RUN}`, `e2e-recread-${RUN}`];
  const marker = `E2E ${RUN}`;
  let staffCookie = "";
  let guestCookie = "";
  let readerCookie = "";
  let draftId = "";

  const job = (patch: Record<string, unknown> = {}) => ({
    title: `${marker} Senior Designer`,
    jobType: "full_time",
    workMode: "hybrid",
    vacancies: 2,
    location: "Dhaka",
    officeTiming: "Mon - Fri, 11 AM to 6 PM",
    description: "Design things.\n\nWith care.",
    requirements: "Five years\nPortfolio",
    benefits: "Lunch",
    salaryMin: "50000",
    salaryMax: "80000.50",
    deadlineOn: dhakaDay(14),
    questions: [{ text: "Why us?" }, { text: "Link to your best work", required: false }],
    ...patch,
  });

  const api = (method: "GET" | "POST" | "PATCH", url: string, options: { payload?: object; cookie?: string } = {}) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      payload: options.payload,
      headers: options.cookie ? { cookie: options.cookie } : {},
    });
  const asStaff = (method: "GET" | "POST" | "PATCH", url: string, payload?: object) =>
    api(method, url, { payload, cookie: staffCookie });

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
    await makeUser(staffEmail, roleNames[0]!, ["recruitment.job.read", "recruitment.job.create", "recruitment.job.update"]);
    await makeUser(guestEmail, roleNames[1]!, ["inventory.stock.read"]);
    await makeUser(readerEmail, roleNames[2]!, ["recruitment.job.read"]);

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    staffCookie = await signIn(staffEmail);
    guestCookie = await signIn(guestEmail);
    readerCookie = await signIn(readerEmail);
  });

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    // Only this run's rows: the other e2e suites share the database and run in parallel.
    const ours = `select id from recruitment.jobs where title like $1`;
    await pool.query(
      `delete from core.audit_log where entity_id in (select id::text from recruitment.jobs where title like $1)`,
      [`${marker}%`],
    );
    await pool.query(`delete from recruitment.job_questions where job_id in (${ours})`, [`${marker}%`]);
    await pool.query(`delete from recruitment.jobs where title like $1`, [`${marker}%`]);
    await db.delete(users).where(like(users.email, `e2e-%-${RUN}@test.invalid`));
    for (const name of roleNames) await db.delete(roles).where(eq(roles.name, name));
    await pool.end();
  });

  describe("access", () => {
    it("needs a session", async () => {
      expect((await api("GET", "/recruitment/jobs")).statusCode).toBe(401);
      expect((await api("POST", "/recruitment/jobs", { payload: job() })).statusCode).toBe(401);
    });

    it("needs the right permission for each action", async () => {
      expect((await api("GET", "/recruitment/jobs", { cookie: guestCookie })).statusCode).toBe(403);
      expect((await api("POST", "/recruitment/jobs", { payload: job(), cookie: readerCookie })).statusCode).toBe(403);
      expect(
        (await api("PATCH", `/recruitment/jobs/${randomUUID()}`, { payload: { vacancies: 3 }, cookie: readerCookie })).statusCode,
      ).toBe(403);
      expect((await api("POST", `/recruitment/jobs/${randomUUID()}/close`, { cookie: readerCookie })).statusCode).toBe(403);
      expect((await api("GET", "/recruitment/jobs", { cookie: readerCookie })).statusCode).toBe(200);
    });
  });

  describe("creating a job", () => {
    it("saves a draft with its questions in order, and normalises the salary", async () => {
      const response = await asStaff("POST", "/recruitment/jobs", job());
      expect(response.statusCode).toBe(201);
      const body = response.json<JobBody>();
      draftId = body.id;

      expect(body).toMatchObject({
        title: `${marker} Senior Designer`,
        status: "draft",
        acceptingApplications: false,
        salaryMin: "50000",
        salaryMax: "80000.5",
        publishedAt: null,
        closedAt: null,
      });
      expect(body.slug).toMatch(/^e2e-[a-z0-9-]+-[0-9a-f]{6}$/);
      expect(body.questions.map((question) => [question.position, question.text, question.required])).toEqual([
        [0, "Why us?", true],
        [1, "Link to your best work", false],
      ]);
    });

    it("gives two jobs with the same title different slugs", async () => {
      const first = (await asStaff("POST", "/recruitment/jobs", job({ title: `${marker} Twin` }))).json<JobBody>();
      const second = (await asStaff("POST", "/recruitment/jobs", job({ title: `${marker} Twin` }))).json<JobBody>();
      expect(first.slug).not.toBe(second.slug);
    });

    it("can publish straight away", async () => {
      const response = await asStaff("POST", "/recruitment/jobs", job({ title: `${marker} Instant`, publish: true }));
      const body = response.json<JobBody>();
      expect(body).toMatchObject({ status: "open", acceptingApplications: true });
      expect(body.publishedAt).not.toBeNull();
    });

    it("accepts a fixed or negotiable salary", async () => {
      const fixed = await asStaff("POST", "/recruitment/jobs", job({ title: `${marker} Fixed`, salaryMax: null }));
      expect(fixed.json<JobBody>()).toMatchObject({ salaryMin: "50000", salaryMax: null });
      const negotiable = await asStaff(
        "POST",
        "/recruitment/jobs",
        job({ title: `${marker} Negotiable`, salaryMin: null, salaryMax: null }),
      );
      expect(negotiable.json<JobBody>()).toMatchObject({ salaryMin: null, salaryMax: null });
    });

    it.each([
      ["a past deadline", { deadlineOn: dhakaDay(-1) }],
      ["a maximum below the minimum", { salaryMin: "90000", salaryMax: "80000" }],
      ["a maximum without a minimum", { salaryMin: null, salaryMax: "80000" }],
      ["zero vacancies", { vacancies: 0 }],
      ["an unknown job type", { jobType: "internship" }],
      ["21 questions", { questions: Array.from({ length: 21 }, (_, n) => ({ text: `Q${n}` })) }],
    ])("rejects %s", async (_name, patch) => {
      const response = await asStaff("POST", "/recruitment/jobs", job(patch));
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: "VALIDATION_FAILED" });
    });

    it("allows today as the last day", async () => {
      const response = await asStaff(
        "POST",
        "/recruitment/jobs",
        job({ title: `${marker} Today`, deadlineOn: dhakaDay(0), publish: true }),
      );
      expect(response.statusCode).toBe(201);
      expect(response.json<JobBody>().acceptingApplications).toBe(true);
    });
  });

  describe("reading jobs", () => {
    it("returns one job with its questions, and 404 / 400 for a bad id", async () => {
      const response = await asStaff("GET", `/recruitment/jobs/${draftId}`);
      expect(response.statusCode).toBe(200);
      expect(response.json<JobBody>()).toMatchObject({ id: draftId, description: "Design things.\n\nWith care." });

      expect((await asStaff("GET", `/recruitment/jobs/${randomUUID()}`)).statusCode).toBe(404);
      expect((await asStaff("GET", "/recruitment/jobs/not-a-uuid")).statusCode).toBe(400);
    });

    it("lists with a status filter, search and paging, without the description", async () => {
      const found = await asStaff("GET", `/recruitment/jobs?q=${encodeURIComponent(marker)}&pageSize=3&sort=title&order=asc`);
      expect(found.statusCode).toBe(200);
      const body = found.json<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }>();
      expect(body).toMatchObject({ page: 1, pageSize: 3 });
      expect(body.total).toBeGreaterThanOrEqual(6);
      expect(body.items).toHaveLength(3);
      expect(body.items[0]).not.toHaveProperty("description");

      const drafts = await asStaff("GET", `/recruitment/jobs?q=${encodeURIComponent(marker)}&status=draft&pageSize=100`);
      const items = drafts.json<{ items: { status: string }[] }>().items;
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items.every((item) => item.status === "draft")).toBe(true);
    });

    it("treats % and _ in a search as plain characters", async () => {
      const response = await asStaff("GET", `/recruitment/jobs?q=${encodeURIComponent(`${marker} %`)}`);
      expect(response.json()).toMatchObject({ total: 0 });
    });
  });

  describe("editing a job", () => {
    it("changes fields and checks the salary against what is stored", async () => {
      const changed = await asStaff("PATCH", `/recruitment/jobs/${draftId}`, { vacancies: 5, benefits: "Lunch and transport" });
      expect(changed.statusCode).toBe(200);
      expect(changed.json<JobBody>()).toMatchObject({ vacancies: 5, benefits: "Lunch and transport", salaryMin: "50000" });

      // Only the maximum is sent, but it must still fit the stored minimum.
      const bad = await asStaff("PATCH", `/recruitment/jobs/${draftId}`, { salaryMax: "40000" });
      expect(bad.statusCode).toBe(400);
      const cleared = await asStaff("PATCH", `/recruitment/jobs/${draftId}`, { salaryMin: null, salaryMax: null });
      expect(cleared.json<JobBody>()).toMatchObject({ salaryMin: null, salaryMax: null });
    });

    it("rejects an empty change, a past deadline and an unknown job", async () => {
      expect((await asStaff("PATCH", `/recruitment/jobs/${draftId}`, {})).statusCode).toBe(400);
      expect((await asStaff("PATCH", `/recruitment/jobs/${draftId}`, { deadlineOn: dhakaDay(-2) })).statusCode).toBe(400);
      expect((await asStaff("PATCH", `/recruitment/jobs/${randomUUID()}`, { vacancies: 1 })).statusCode).toBe(404);
    });

    it("edits, reorders, adds and archives questions", async () => {
      const before = (await asStaff("GET", `/recruitment/jobs/${draftId}`)).json<JobBody>().questions;
      const [first, second] = before;

      // Move the second question first and reword it, drop the first, add a new one.
      const response = await asStaff("PATCH", `/recruitment/jobs/${draftId}`, {
        questions: [{ id: second!.id, text: "Where is your portfolio?", required: true }, { text: "Notice period?" }],
      });
      expect(response.statusCode).toBe(200);
      const after = response.json<JobBody>().questions;
      expect(after.map((question) => [question.position, question.text, question.required])).toEqual([
        [0, "Where is your portfolio?", true],
        [1, "Notice period?", true],
      ]);
      expect(after[0]!.id).toBe(second!.id);

      // The dropped question is archived, not deleted.
      const { rows } = await pool.query<{ archived: boolean }>(
        `select archived_at is not null as archived from recruitment.job_questions where id = $1`,
        [first!.id],
      );
      expect(rows).toEqual([{ archived: true }]);
    });

    it("rejects a question from another job, a repeated question and an over-long list", async () => {
      const other = (await asStaff("POST", "/recruitment/jobs", job({ title: `${marker} Other` }))).json<JobBody>();
      const mine = (await asStaff("GET", `/recruitment/jobs/${draftId}`)).json<JobBody>().questions[0]!;

      const foreign = await asStaff("PATCH", `/recruitment/jobs/${draftId}`, {
        questions: [{ id: other.questions[0]!.id, text: "Stolen" }],
      });
      expect(foreign.statusCode).toBe(400);

      const twice = await asStaff("PATCH", `/recruitment/jobs/${draftId}`, {
        questions: [
          { id: mine.id, text: "A" },
          { id: mine.id, text: "B" },
        ],
      });
      expect(twice.statusCode).toBe(400);

      const tooMany = await asStaff("PATCH", `/recruitment/jobs/${draftId}`, {
        questions: Array.from({ length: 21 }, (_, n) => ({ text: `Q${n}` })),
      });
      expect(tooMany.statusCode).toBe(400);

      // A failed edit leaves the questions as they were.
      const unchanged = (await asStaff("GET", `/recruitment/jobs/${draftId}`)).json<JobBody>().questions;
      expect(unchanged.map((question) => question.text)).toEqual(["Where is your portfolio?", "Notice period?"]);
    });

    it("clears every question with an empty list", async () => {
      const response = await asStaff("PATCH", `/recruitment/jobs/${draftId}`, { questions: [] });
      expect(response.json<JobBody>().questions).toEqual([]);
    });
  });

  describe("publishing, closing and reopening", () => {
    it("publishes a draft, and only a draft", async () => {
      const published = await asStaff("POST", `/recruitment/jobs/${draftId}/publish`);
      expect(published.statusCode).toBe(200);
      expect(published.json<JobBody>()).toMatchObject({ status: "open", acceptingApplications: true });
      expect(published.json<JobBody>().publishedAt).not.toBeNull();

      expect((await asStaff("POST", `/recruitment/jobs/${draftId}/publish`)).statusCode).toBe(409);
      expect((await asStaff("POST", `/recruitment/jobs/${randomUUID()}/publish`)).statusCode).toBe(404);
    });

    it("refuses to publish a draft whose deadline has passed", async () => {
      // Create with a valid deadline, then age it directly: the API refuses to save a past deadline.
      const stale = (await asStaff("POST", "/recruitment/jobs", job({ title: `${marker} Stale` }))).json<JobBody>();
      await pool.query(`update recruitment.jobs set deadline_on = $2 where id = $1`, [stale.id, dhakaDay(-3)]);

      const response = await asStaff("POST", `/recruitment/jobs/${stale.id}/publish`);
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ code: "VALIDATION_FAILED" });
    });

    it("closes an open job at once, and only an open job", async () => {
      const closed = await asStaff("POST", `/recruitment/jobs/${draftId}/close`);
      expect(closed.statusCode).toBe(200);
      expect(closed.json<JobBody>()).toMatchObject({ status: "closed", acceptingApplications: false });
      expect(closed.json<JobBody>().closedAt).not.toBeNull();

      expect((await asStaff("POST", `/recruitment/jobs/${draftId}/close`)).statusCode).toBe(409);
    });

    it("reopens a closed job, and only a closed job", async () => {
      const reopened = await asStaff("POST", `/recruitment/jobs/${draftId}/reopen`, {});
      expect(reopened.statusCode).toBe(200);
      expect(reopened.json<JobBody>()).toMatchObject({ status: "open", acceptingApplications: true, closedAt: null });

      expect((await asStaff("POST", `/recruitment/jobs/${draftId}/reopen`, {})).statusCode).toBe(409);
    });

    it("needs a new deadline to reopen a job whose deadline has passed", async () => {
      const expired = (
        await asStaff("POST", "/recruitment/jobs", job({ title: `${marker} Expired`, publish: true }))
      ).json<JobBody>();
      await asStaff("POST", `/recruitment/jobs/${expired.id}/close`);
      await pool.query(`update recruitment.jobs set deadline_on = $2 where id = $1`, [expired.id, dhakaDay(-3)]);

      const refused = await asStaff("POST", `/recruitment/jobs/${expired.id}/reopen`, {});
      expect(refused.statusCode).toBe(400);
      expect(refused.json()).toMatchObject({ code: "VALIDATION_FAILED" });
      expect((await asStaff("POST", `/recruitment/jobs/${expired.id}/reopen`, { deadlineOn: dhakaDay(-1) })).statusCode).toBe(
        400,
      );

      const ok = await asStaff("POST", `/recruitment/jobs/${expired.id}/reopen`, { deadlineOn: dhakaDay(7) });
      expect(ok.statusCode).toBe(200);
      expect(ok.json<JobBody>()).toMatchObject({ status: "open", deadlineOn: dhakaDay(7), acceptingApplications: true });
    });

    it("shows an open job past its deadline as not accepting applications", async () => {
      const lapsed = (
        await asStaff("POST", "/recruitment/jobs", job({ title: `${marker} Lapsed`, publish: true }))
      ).json<JobBody>();
      await pool.query(`update recruitment.jobs set deadline_on = $2 where id = $1`, [lapsed.id, dhakaDay(-1)]);

      const body = (await asStaff("GET", `/recruitment/jobs/${lapsed.id}`)).json<JobBody>();
      expect(body).toMatchObject({ status: "open", acceptingApplications: false });
    });
  });

  describe("audit", () => {
    it("records each change with ids and field names, never the job's text", async () => {
      const { rows } = await pool.query<{ action: string; actor_id: string | null }>(
        `select action, actor_id from core.audit_log where entity_id = $1 order by occurred_at`,
        [draftId],
      );
      const actions = rows.map((row) => row.action);
      expect(actions).toEqual(
        expect.arrayContaining([
          "recruitment.job.created",
          "recruitment.job.updated",
          "recruitment.job.published",
          "recruitment.job.closed",
          "recruitment.job.reopened",
        ]),
      );
      expect(rows.every((row) => row.actor_id !== null)).toBe(true);

      const all = await pool.query(`select metadata from core.audit_log where entity_id = $1`, [draftId]);
      const text = JSON.stringify(all.rows);
      expect(text).not.toContain("Senior Designer");
      expect(text).not.toContain("portfolio");
      expect(text).not.toContain("Lunch");
    });
  });
});
