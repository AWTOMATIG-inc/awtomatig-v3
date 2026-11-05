import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { users } from "../src/shared/auth/auth.schema";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";
import { WebsiteRevalidator } from "../src/shared/website/website-revalidator";

// The FAQ endpoints against a real, migrated PostgreSQL (backend/RULES.md section 6). It creates its own users, roles and FAQs and
// removes them afterwards. Skipped unless TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://… npm test -- faqs.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";
const RUN = randomUUID().slice(0, 8);

interface FaqBody {
  id: string;
  status: string;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  question: string;
  answer: string;
}

interface ListBody {
  items: FaqBody[];
  total: number;
  page: number;
  pageSize: number;
}

describeWithDb("CMS FAQs (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const staffEmail = `e2e-faq-staff-${RUN}@test.invalid`;
  const ownerEmail = `e2e-faq-owner-${RUN}@test.invalid`;
  const readerEmail = `e2e-faq-reader-${RUN}@test.invalid`;
  const guestEmail = `e2e-faq-guest-${RUN}@test.invalid`;
  const roleNames = [`e2e-faq-staff-${RUN}`, `e2e-faq-owner-${RUN}`, `e2e-faq-read-${RUN}`, `e2e-faq-none-${RUN}`];
  const marker = `E2E ${RUN}`;
  let staffCookie = "";
  let ownerCookie = "";
  let readerCookie = "";
  let guestCookie = "";
  let refreshes: jest.SpyInstance;

  let sequence = 0;
  const faq = (patch: Record<string, unknown> = {}) => ({
    question: `${marker} Question ${sequence++}?`,
    answer: "Yes. We start by understanding the tools you already use.",
    ...patch,
  });

  type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  const api = (method: Method, url: string, options: { payload?: object; cookie?: string } = {}) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      payload: options.payload,
      headers: options.cookie ? { cookie: options.cookie } : {},
    });
  const asStaff = (method: Method, url: string, payload?: object) => api(method, url, { payload, cookie: staffCookie });
  const asOwner = (method: Method, url: string, payload?: object) => api(method, url, { payload, cookie: ownerCookie });

  async function createDraft(patch: Record<string, unknown> = {}): Promise<FaqBody> {
    const response = await asStaff("POST", "/cms/faqs", faq(patch));
    expect(response.statusCode).toBe(201);
    return response.json<FaqBody>();
  }

  async function createPublished(patch: Record<string, unknown> = {}): Promise<FaqBody> {
    const draft = await createDraft(patch);
    const response = await asStaff("POST", `/cms/faqs/${draft.id}/publish`);
    expect(response.statusCode).toBe(200);
    return response.json<FaqBody>();
  }

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

  /** Every FAQ in the database in display order, other suites' and seeded ones included. */
  async function allIds(): Promise<string[]> {
    const response = await asStaff("GET", "/cms/faqs?pageSize=100&sort=sortOrder&order=asc");
    return response.json<ListBody>().items.map((item) => item.id);
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    // This suite sends far more than the default 120 requests a minute from one address, which the rate limiter would refuse.
    process.env.RATE_LIMIT_MAX = "100000";
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
    // Staff can do everything except delete, so the delete permission is tested on its own.
    await makeUser(staffEmail, roleNames[0]!, ["cms.faq.read", "cms.faq.create", "cms.faq.update"]);
    await makeUser(ownerEmail, roleNames[1]!, ["cms.faq.read", "cms.faq.create", "cms.faq.update", "cms.faq.delete"]);
    await makeUser(readerEmail, roleNames[2]!, ["cms.faq.read"]);
    // Other CMS permissions must not open the FAQ endpoints.
    await makeUser(guestEmail, roleNames[3]!, [
      "cms.testimonial.read",
      "cms.testimonial.update",
      "cms.testimonial.delete",
      "cms.case_study.read",
      "cms.metric.read",
      "cms.metric.update",
    ]);

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    // Nothing here has a website to call; the spy only records that the refresh was asked for.
    refreshes = jest.spyOn(app.get(WebsiteRevalidator), "faqsChanged").mockResolvedValue();

    staffCookie = await signIn(staffEmail);
    ownerCookie = await signIn(ownerEmail);
    readerCookie = await signIn(readerEmail);
    guestCookie = await signIn(guestEmail);
  });

  beforeEach(() => refreshes.mockClear());

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    // Only this run's rows: the other e2e suites share the database and run in parallel.
    await pool.query(`delete from cms.faqs where question like $1`, [`${marker}%`]);
    await pool.query(
      `delete from core.audit_log where action like 'cms.faq.%' and actor_id in (select id from core.users where email like $1)`,
      [`e2e-faq-%-${RUN}@test.invalid`],
    );
    await db.delete(users).where(like(users.email, `e2e-faq-%-${RUN}@test.invalid`));
    for (const name of roleNames) await db.delete(roles).where(eq(roles.name, name));
    await pool.end();
  });

  describe("access", () => {
    it("needs a session", async () => {
      expect((await api("GET", "/cms/faqs")).statusCode).toBe(401);
      expect((await api("POST", "/cms/faqs", { payload: faq() })).statusCode).toBe(401);
      expect((await api("PUT", "/cms/faqs/order", { payload: { ids: [randomUUID()] } })).statusCode).toBe(401);
      expect((await api("DELETE", `/cms/faqs/${randomUUID()}`)).statusCode).toBe(401);
    });

    it("refuses an employee without the permission, even one who manages testimonials, case studies or metrics", async () => {
      const id = randomUUID();
      const as = (method: Method, url: string, payload?: object) => api(method, url, { payload, cookie: guestCookie });
      expect((await as("GET", "/cms/faqs")).statusCode).toBe(403);
      expect((await as("GET", `/cms/faqs/${id}`)).statusCode).toBe(403);
      expect((await as("POST", "/cms/faqs", faq())).statusCode).toBe(403);
      expect((await as("PATCH", `/cms/faqs/${id}`, { answer: "x" })).statusCode).toBe(403);
      expect((await as("POST", `/cms/faqs/${id}/publish`)).statusCode).toBe(403);
      expect((await as("POST", `/cms/faqs/${id}/unpublish`)).statusCode).toBe(403);
      expect((await as("PUT", "/cms/faqs/order", { ids: [id] })).statusCode).toBe(403);
      expect((await as("DELETE", `/cms/faqs/${id}`)).statusCode).toBe(403);
    });

    it("lets a reader read but not change anything", async () => {
      const draft = await createDraft();
      const reader = (method: Method, url: string, payload?: object) => api(method, url, { payload, cookie: readerCookie });
      expect((await reader("GET", "/cms/faqs")).statusCode).toBe(200);
      expect((await reader("GET", `/cms/faqs/${draft.id}`)).statusCode).toBe(200);
      expect((await reader("POST", "/cms/faqs", faq())).statusCode).toBe(403);
      expect((await reader("PATCH", `/cms/faqs/${draft.id}`, { answer: "x" })).statusCode).toBe(403);
      expect((await reader("POST", `/cms/faqs/${draft.id}/publish`)).statusCode).toBe(403);
      expect((await reader("PUT", "/cms/faqs/order", { ids: [draft.id] })).statusCode).toBe(403);
    });

    it("keeps delete separate from update", async () => {
      const draft = await createDraft();
      expect((await asStaff("DELETE", `/cms/faqs/${draft.id}`)).statusCode).toBe(403);
      expect((await asOwner("DELETE", `/cms/faqs/${draft.id}`)).statusCode).toBe(204);
    });
  });

  describe("create", () => {
    it("saves a draft at the next position and does not refresh the website", async () => {
      const first = await createDraft();
      const second = await createDraft();

      expect(first).toMatchObject({ status: "draft", publishedAt: null });
      expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(second.sortOrder).toBe(first.sortOrder + 1);
      expect(refreshes).not.toHaveBeenCalled();
    });

    it("trims the text, keeps line breaks and non-ASCII characters", async () => {
      const created = await createDraft({
        question: `${marker}   Why  not?  `,
        answer: "  First line.\nSecond line — it’s fine.  ",
      });
      expect(created.question).toBe(`${marker}   Why  not?`);
      expect(created.answer).toBe("First line.\nSecond line — it’s fine.");
    });

    it("accepts the longest question and answer and refuses one character more", async () => {
      const question = `${marker} ${"q".repeat(200 - marker.length - 1)}`;
      expect((await asStaff("POST", "/cms/faqs", faq({ question, answer: "a".repeat(1000) }))).statusCode).toBe(201);
      expect((await asStaff("POST", "/cms/faqs", faq({ question: `${question}q` }))).statusCode).toBe(400);
      expect((await asStaff("POST", "/cms/faqs", faq({ answer: "a".repeat(1001) }))).statusCode).toBe(400);
    });

    it("refuses empty or missing text", async () => {
      expect((await asStaff("POST", "/cms/faqs", faq({ question: "   " }))).statusCode).toBe(400);
      expect((await asStaff("POST", "/cms/faqs", faq({ answer: "" }))).statusCode).toBe(400);
      expect((await asStaff("POST", "/cms/faqs", { question: `${marker} only a question` })).statusCode).toBe(400);
    });

    it("ignores a status, position or id sent by the client", async () => {
      const id = randomUUID();
      const response = await asStaff("POST", "/cms/faqs", faq({ status: "published", sortOrder: 0, id }));
      expect(response.statusCode).toBe(201);
      const body = response.json<FaqBody>();
      expect(body.status).toBe("draft");
      expect(body.id).not.toBe(id);
    });
  });

  describe("list and get", () => {
    it("filters by status and finds text in the question or the answer, with % and _ taken literally", async () => {
      const draft = await createDraft({ question: `${marker} Find_me 100%?`, answer: "plain" });
      const live = await createPublished({ question: `${marker} Live one?`, answer: `needle-${RUN}` });

      const drafts = (await asStaff("GET", `/cms/faqs?status=draft&q=${encodeURIComponent(marker)}`)).json<ListBody>();
      expect(drafts.items.map((item) => item.id)).toContain(draft.id);
      expect(drafts.items.map((item) => item.id)).not.toContain(live.id);

      const byAnswer = (await asStaff("GET", `/cms/faqs?q=needle-${RUN}`)).json<ListBody>();
      expect(byAnswer.items.map((item) => item.id)).toEqual([live.id]);

      const literal = (await asStaff("GET", `/cms/faqs?q=${encodeURIComponent("Find_me 100%")}`)).json<ListBody>();
      expect(literal.items.map((item) => item.id)).toEqual([draft.id]);
      const wildcard = (await asStaff("GET", `/cms/faqs?q=${encodeURIComponent(`${marker} %`)}`)).json<ListBody>();
      expect(wildcard.total).toBe(0);
    });

    it("pages, sorts and refuses bad parameters", async () => {
      await createDraft();
      await createDraft();
      const paged = (await asStaff("GET", "/cms/faqs?pageSize=1&page=2")).json<ListBody>();
      expect(paged).toMatchObject({ page: 2, pageSize: 1 });
      expect(paged.items).toHaveLength(1);
      expect((await asStaff("GET", "/cms/faqs?pageSize=101")).statusCode).toBe(400);
      expect((await asStaff("GET", "/cms/faqs?status=archived")).statusCode).toBe(400);
      expect((await asStaff("GET", "/cms/faqs?sort=answer")).statusCode).toBe(400);
    });

    it("gets one FAQ and answers 404 or 400 for an unknown or malformed id", async () => {
      const draft = await createDraft();
      expect((await asStaff("GET", `/cms/faqs/${draft.id}`)).json<FaqBody>()).toEqual(draft);
      expect((await asStaff("GET", `/cms/faqs/${randomUUID()}`)).statusCode).toBe(404);
      expect((await asStaff("GET", "/cms/faqs/not-an-id")).statusCode).toBe(400);
    });
  });

  describe("edit", () => {
    it("changes only the fields sent and leaves a draft off the website refresh", async () => {
      const draft = await createDraft({ answer: "Original answer." });
      const response = await asStaff("PATCH", `/cms/faqs/${draft.id}`, { answer: "New answer." });
      expect(response.statusCode).toBe(200);
      expect(response.json<FaqBody>()).toMatchObject({ question: draft.question, answer: "New answer.", status: "draft" });
      expect(refreshes).not.toHaveBeenCalled();
    });

    it("refreshes the website when a published FAQ is edited", async () => {
      const live = await createPublished();
      refreshes.mockClear();
      expect((await asStaff("PATCH", `/cms/faqs/${live.id}`, { question: `${marker} Edited live?` })).statusCode).toBe(200);
      expect(refreshes).toHaveBeenCalledTimes(1);
    });

    it("leaves the row untouched on an empty or invalid edit", async () => {
      const draft = await createDraft();
      expect((await asStaff("PATCH", `/cms/faqs/${draft.id}`, {})).statusCode).toBe(400);
      expect((await asStaff("PATCH", `/cms/faqs/${draft.id}`, { answer: "  " })).statusCode).toBe(400);
      expect((await asStaff("PATCH", `/cms/faqs/${draft.id}`, { answer: "a".repeat(1001) })).statusCode).toBe(400);
      expect((await asStaff("GET", `/cms/faqs/${draft.id}`)).json<FaqBody>()).toEqual(draft);
    });

    it("cannot change the status or position through an edit, and 404s for an unknown id", async () => {
      const draft = await createDraft();
      const response = await asStaff("PATCH", `/cms/faqs/${draft.id}`, {
        answer: "Still a draft.",
        status: "published",
        sortOrder: 0,
      });
      expect(response.json<FaqBody>()).toMatchObject({ status: "draft", sortOrder: draft.sortOrder });
      expect((await asStaff("PATCH", `/cms/faqs/${randomUUID()}`, { answer: "x" })).statusCode).toBe(404);
    });
  });

  describe("publish and unpublish", () => {
    it("publishes a draft, sets the date once, and refreshes the website", async () => {
      const draft = await createDraft();
      const published = await asStaff("POST", `/cms/faqs/${draft.id}/publish`);
      expect(published.statusCode).toBe(200);
      const body = published.json<FaqBody>();
      expect(body.status).toBe("published");
      expect(body.publishedAt).not.toBeNull();
      expect(refreshes).toHaveBeenCalledTimes(1);
    });

    it("keeps the first publish date through unpublish and publish again", async () => {
      const first = await createPublished();
      const off = await asStaff("POST", `/cms/faqs/${first.id}/unpublish`);
      expect(off.json<FaqBody>()).toMatchObject({ status: "draft", publishedAt: first.publishedAt });
      const again = await asStaff("POST", `/cms/faqs/${first.id}/publish`);
      expect(again.json<FaqBody>().publishedAt).toBe(first.publishedAt);
    });

    it("answers 409 for the wrong state and 404 for an unknown id", async () => {
      const draft = await createDraft();
      expect((await asStaff("POST", `/cms/faqs/${draft.id}/unpublish`)).statusCode).toBe(409);
      await asStaff("POST", `/cms/faqs/${draft.id}/publish`);
      expect((await asStaff("POST", `/cms/faqs/${draft.id}/publish`)).statusCode).toBe(409);
      expect((await asStaff("POST", `/cms/faqs/${randomUUID()}/publish`)).statusCode).toBe(404);
      expect((await asStaff("POST", `/cms/faqs/${randomUUID()}/unpublish`)).statusCode).toBe(404);
    });

    it("lets two simultaneous publishes through once", async () => {
      const draft = await createDraft();
      const [a, b] = await Promise.all([
        asStaff("POST", `/cms/faqs/${draft.id}/publish`),
        asStaff("POST", `/cms/faqs/${draft.id}/publish`),
      ]);
      expect([a.statusCode, b.statusCode].sort()).toEqual([200, 409]);
    });

    it("refuses to publish when the website's list of 100 is full", async () => {
      const { rows } = await pool.query<{ total: string }>(`select count(*) as total from cms.faqs where status = 'published'`);
      const missing = 100 - Number(rows[0]!.total);
      expect(missing).toBeGreaterThanOrEqual(0);
      // Fill the list directly: one hundred API calls would only slow the suite down.
      await pool.query(
        `insert into cms.faqs (id, status, sort_order, published_at, question, answer)
         select gen_random_uuid(), 'published', 100000 + n, now(), $1 || ' filler ' || n, 'filler'
         from generate_series(1, $2::int) as n`,
        [marker, missing],
      );
      try {
        const draft = await createDraft();
        const refused = await asStaff("POST", `/cms/faqs/${draft.id}/publish`);
        expect(refused.statusCode).toBe(409);
        expect(refused.json<{ message: string }>().message).toContain("100");
        expect((await asStaff("GET", `/cms/faqs/${draft.id}`)).json<FaqBody>().status).toBe("draft");
        const publicList = (await api("GET", "/cms/public/faqs")).json<{ faqs: unknown[] }>();
        expect(publicList.faqs.length).toBeLessThanOrEqual(100);
      } finally {
        await pool.query(`delete from cms.faqs where question like $1`, [`${marker} filler %`]);
      }
    });
  });

  describe("order", () => {
    it("saves a new order and refreshes the website", async () => {
      const a = await createDraft();
      const b = await createDraft();
      const ids = await allIds();
      const swapped = ids.map((id) => (id === a.id ? b.id : id === b.id ? a.id : id));

      const response = await asStaff("PUT", "/cms/faqs/order", { ids: swapped });
      expect(response.statusCode).toBe(200);
      expect(response.json<ListBody>().items.map((item) => item.id)).toEqual(swapped);
      expect(refreshes).toHaveBeenCalledTimes(1);
    });

    it("refuses a list that misses an FAQ, repeats one or holds an unknown id, and changes nothing", async () => {
      await createDraft();
      const ids = await allIds();
      const before = (await asStaff("GET", "/cms/faqs?pageSize=100")).json<ListBody>().items.map((item) => item.id);

      expect((await asStaff("PUT", "/cms/faqs/order", { ids: ids.slice(1) })).statusCode).toBe(400);
      expect((await asStaff("PUT", "/cms/faqs/order", { ids: [...ids, ids[0]] })).statusCode).toBe(400);
      expect((await asStaff("PUT", "/cms/faqs/order", { ids: [...ids.slice(1), randomUUID()] })).statusCode).toBe(400);
      expect((await asStaff("PUT", "/cms/faqs/order", { ids: [] })).statusCode).toBe(400);
      expect((await asStaff("GET", "/cms/faqs?pageSize=100")).json<ListBody>().items.map((item) => item.id)).toEqual(before);
      expect(refreshes).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes a draft without refreshing the website", async () => {
      const draft = await createDraft();
      expect((await asOwner("DELETE", `/cms/faqs/${draft.id}`)).statusCode).toBe(204);
      expect((await asStaff("GET", `/cms/faqs/${draft.id}`)).statusCode).toBe(404);
      expect(refreshes).not.toHaveBeenCalled();
    });

    it("deletes a published FAQ too, and refreshes the website", async () => {
      const live = await createPublished();
      refreshes.mockClear();
      expect((await asOwner("DELETE", `/cms/faqs/${live.id}`)).statusCode).toBe(204);
      expect((await asStaff("GET", `/cms/faqs/${live.id}`)).statusCode).toBe(404);
      expect(refreshes).toHaveBeenCalledTimes(1);
    });

    it("answers 404 for an unknown id and 400 for a malformed one", async () => {
      expect((await asOwner("DELETE", `/cms/faqs/${randomUUID()}`)).statusCode).toBe(404);
      expect((await asOwner("DELETE", "/cms/faqs/not-an-id")).statusCode).toBe(400);
    });
  });

  describe("database checks", () => {
    it("refuses text outside the limits even when the application is bypassed", async () => {
      const insert = (question: string, answer: string, status = "draft") =>
        pool.query(`insert into cms.faqs (id, status, sort_order, question, answer) values (gen_random_uuid(), $1, 0, $2, $3)`, [
          status,
          question,
          answer,
        ]);
      await expect(insert("", "answer")).rejects.toThrow(/faqs_question_check/);
      await expect(insert(`${marker} q`, "")).rejects.toThrow(/faqs_answer_check/);
      await expect(insert("q".repeat(201), "answer")).rejects.toThrow(/faqs_question_check/);
      await expect(insert(`${marker} q`, "a".repeat(1001))).rejects.toThrow(/faqs_answer_check/);
      await expect(insert(`${marker} q`, "answer", "archived")).rejects.toThrow(/faqs_status_check/);
    });
  });

  describe("audit", () => {
    it("records ids and field names, never the question or answer", async () => {
      const secretQuestion = `${marker} Audit question ${RUN}?`;
      const secretAnswer = `Audit answer ${RUN}`;
      const draft = await createDraft({ question: secretQuestion, answer: secretAnswer });
      await asStaff("PATCH", `/cms/faqs/${draft.id}`, { answer: `${secretAnswer} edited` });
      await asStaff("POST", `/cms/faqs/${draft.id}/publish`);
      await asStaff("POST", `/cms/faqs/${draft.id}/unpublish`);
      await asOwner("DELETE", `/cms/faqs/${draft.id}`);

      const { rows } = await pool.query<{ action: string; metadata: Record<string, unknown> | null }>(
        `select action, metadata from core.audit_log where entity_id = $1 and action like 'cms.faq.%' order by occurred_at, id`,
        [draft.id],
      );
      expect(rows.map((row) => row.action)).toEqual([
        "cms.faq.created",
        "cms.faq.updated",
        "cms.faq.published",
        "cms.faq.unpublished",
        "cms.faq.deleted",
      ]);
      expect(rows[1]!.metadata).toEqual({ fields: ["answer"] });
      expect(JSON.stringify(rows)).not.toContain(RUN);
    });
  });

  describe("public list", () => {
    type PublicItem = { question: string; answer: string };
    const publicApi = () => api("GET", "/cms/public/faqs");
    const questions = async () => (await publicApi()).json<{ faqs: PublicItem[] }>().faqs.map((item) => item.question);

    it("needs no session, lists only published FAQs in display order, and hides drafts and unpublished ones", async () => {
      const first = await createPublished({ question: `${marker} Pub first?` });
      const draft = await createDraft({ question: `${marker} Pub draft?` });
      const second = await createPublished({ question: `${marker} Pub second?` });
      const off = await createPublished({ question: `${marker} Pub off?` });
      await asStaff("POST", `/cms/faqs/${off.id}/unpublish`);

      const response = await publicApi();
      expect(response.statusCode).toBe(200);
      const listed = await questions();
      expect(listed).toContain(first.question);
      expect(listed).toContain(second.question);
      expect(listed).not.toContain(draft.question);
      expect(listed).not.toContain(off.question);
      expect(listed.indexOf(first.question)).toBeLessThan(listed.indexOf(second.question));
    });

    it("follows a new order", async () => {
      const a = await createPublished({ question: `${marker} Order a?` });
      const b = await createPublished({ question: `${marker} Order b?` });
      const ids = await allIds();
      await asStaff("PUT", "/cms/faqs/order", { ids: ids.map((id) => (id === a.id ? b.id : id === b.id ? a.id : id)) });

      const listed = await questions();
      expect(listed.indexOf(b.question)).toBeLessThan(listed.indexOf(a.question));
    });

    it("returns exactly the allow-listed keys and nothing about the row", async () => {
      await createPublished({ question: `${marker} Shape?` });
      const body = (await publicApi()).json<{ faqs: Record<string, unknown>[] }>();
      expect(Object.keys(body)).toEqual(["faqs"]);
      for (const item of body.faqs) expect(Object.keys(item).sort()).toEqual(["answer", "question"]);
    });

    it("drops an FAQ at once when it is deleted", async () => {
      const live = await createPublished({ question: `${marker} Gone soon?` });
      expect(await questions()).toContain(live.question);
      await asOwner("DELETE", `/cms/faqs/${live.id}`);
      expect(await questions()).not.toContain(live.question);
    });
  });
});
