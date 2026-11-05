import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { users } from "../src/shared/auth/auth.schema";
import { AuditService } from "../src/shared/audit/audit.service";
import { WebsiteRevalidator } from "../src/modules/cms/service/website-revalidator";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";
import { StorageUnavailableError } from "../src/shared/storage/storage.errors";
import { StorageService } from "../src/shared/storage/storage.service";
import { jpeg, png, webp } from "./support/images";

// The testimonial endpoints against a real, migrated PostgreSQL (backend/RULES.md section 6). It creates its own users, roles and
// testimonials and removes them afterwards. Skipped unless TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://… npm test -- testimonials.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";
const RUN = randomUUID().slice(0, 8);

interface TestimonialBody {
  id: string;
  status: string;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  service: string;
  consentConfirmed: boolean;
  logoInBlack: boolean;
  logo: { url: string; width: number; height: number } | null;
}

describeWithDb("CMS testimonials (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const staffEmail = `e2e-tst-staff-${RUN}@test.invalid`;
  const ownerEmail = `e2e-tst-owner-${RUN}@test.invalid`;
  const readerEmail = `e2e-tst-reader-${RUN}@test.invalid`;
  const guestEmail = `e2e-tst-guest-${RUN}@test.invalid`;
  const roleNames = [`e2e-tst-staff-${RUN}`, `e2e-tst-owner-${RUN}`, `e2e-tst-read-${RUN}`, `e2e-tst-none-${RUN}`];
  const marker = `E2E ${RUN}`;
  let staffCookie = "";
  let ownerCookie = "";
  let readerCookie = "";
  let guestCookie = "";
  let refreshes: jest.SpyInstance;
  // The fake public bucket: key to the stored bytes, type and cache header. Nothing here touches R2.
  const objects = new Map<string, { body: Buffer; contentType: string; cacheControl?: string }>();
  const keysUnder = (id: string) => [...objects.keys()].filter((key) => key.startsWith(`testimonial/${id}/`));

  let sequence = 0;
  const testimonial = (patch: Record<string, unknown> = {}) => ({
    quote: "They automated our onboarding from end to end.",
    name: `${marker} Person ${sequence++}`,
    role: "Founder",
    company: "No Spain No Gain",
    service: "back-office-operations",
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

  /** Creates a draft as staff and returns it. */
  async function createDraft(patch: Record<string, unknown> = {}): Promise<TestimonialBody> {
    const response = await asStaff("POST", "/cms/testimonials", testimonial(patch));
    expect(response.statusCode).toBe(201);
    return response.json<TestimonialBody>();
  }

  /** Creates a draft with the client's agreement recorded, ready to publish. */
  const createReady = (patch: Record<string, unknown> = {}) => createDraft({ consentConfirmed: true, ...patch });

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
    await makeUser(staffEmail, roleNames[0]!, ["cms.testimonial.read", "cms.testimonial.create", "cms.testimonial.update"]);
    await makeUser(ownerEmail, roleNames[1]!, [
      "cms.testimonial.read",
      "cms.testimonial.create",
      "cms.testimonial.update",
      "cms.testimonial.delete",
    ]);
    await makeUser(readerEmail, roleNames[2]!, ["cms.testimonial.read"]);
    // Case study permissions must not open the testimonial endpoints.
    await makeUser(guestEmail, roleNames[3]!, ["cms.case_study.read", "cms.case_study.update", "cms.case_study.delete"]);

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    const storage = app.get(StorageService);
    // Like R2's conditional upload: a key that is already taken is refused, never overwritten.
    jest.spyOn(storage, "putPublicIfAbsent").mockImplementation((key, body, contentType, cacheControl) => {
      if (objects.has(key)) return Promise.resolve(false);
      objects.set(key, { body, contentType, cacheControl });
      return Promise.resolve(true);
    });
    jest.spyOn(storage, "deletePublic").mockImplementation((key) => {
      objects.delete(key);
      return Promise.resolve();
    });
    jest
      .spyOn(storage, "listPublic")
      .mockImplementation((prefix) => Promise.resolve([...objects.keys()].filter((key) => key.startsWith(prefix))));
    jest.spyOn(storage, "deletePublicPrefix").mockImplementation((prefix) => {
      const doomed = [...objects.keys()].filter((key) => key.startsWith(prefix));
      for (const key of doomed) objects.delete(key);
      return Promise.resolve(doomed.length);
    });
    // Nothing here has a website to call; the spy only records that the refresh was asked for.
    refreshes = jest.spyOn(app.get(WebsiteRevalidator), "testimonialsChanged").mockResolvedValue();

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
    await pool.query(`delete from core.audit_log where entity_id in (select id::text from cms.testimonials where name like $1)`, [
      `${marker}%`,
    ]);
    await pool.query(`delete from cms.testimonials where name like $1`, [`${marker}%`]);
    await pool.query(
      `delete from core.audit_log where action like 'cms.testimonial.%' and actor_id in (select id from core.users where email like $1)`,
      [`e2e-tst-%-${RUN}@test.invalid`],
    );
    await db.delete(users).where(like(users.email, `e2e-tst-%-${RUN}@test.invalid`));
    for (const name of roleNames) await db.delete(roles).where(eq(roles.name, name));
    await pool.end();
  });

  describe("access", () => {
    it("needs a session", async () => {
      expect((await api("GET", "/cms/testimonials")).statusCode).toBe(401);
      expect((await api("POST", "/cms/testimonials", { payload: testimonial() })).statusCode).toBe(401);
      expect((await api("PUT", "/cms/testimonials/order", { payload: { ids: [randomUUID()] } })).statusCode).toBe(401);
      expect((await api("DELETE", `/cms/testimonials/${randomUUID()}`)).statusCode).toBe(401);
    });

    it("refuses an employee without the permission, even one who manages case studies", async () => {
      const id = randomUUID();
      const as = (method: Method, url: string, payload?: object) => api(method, url, { payload, cookie: guestCookie });
      expect((await as("GET", "/cms/testimonials")).statusCode).toBe(403);
      expect((await as("GET", `/cms/testimonials/${id}`)).statusCode).toBe(403);
      expect((await as("POST", "/cms/testimonials", testimonial())).statusCode).toBe(403);
      expect((await as("PATCH", `/cms/testimonials/${id}`, { quote: "x" })).statusCode).toBe(403);
      expect((await as("POST", `/cms/testimonials/${id}/publish`)).statusCode).toBe(403);
      expect((await as("POST", `/cms/testimonials/${id}/unpublish`)).statusCode).toBe(403);
      expect((await as("PUT", "/cms/testimonials/order", { ids: [id] })).statusCode).toBe(403);
      expect((await as("DELETE", `/cms/testimonials/${id}`)).statusCode).toBe(403);
    });

    it("lets a reader read but not change anything", async () => {
      const draft = await createDraft();
      const reader = (method: Method, url: string, payload?: object) => api(method, url, { payload, cookie: readerCookie });
      expect((await reader("GET", "/cms/testimonials")).statusCode).toBe(200);
      expect((await reader("GET", `/cms/testimonials/${draft.id}`)).statusCode).toBe(200);
      expect((await reader("POST", "/cms/testimonials", testimonial())).statusCode).toBe(403);
      expect((await reader("PATCH", `/cms/testimonials/${draft.id}`, { quote: "x" })).statusCode).toBe(403);
      expect((await reader("POST", `/cms/testimonials/${draft.id}/publish`)).statusCode).toBe(403);
      expect((await reader("PUT", "/cms/testimonials/order", { ids: [draft.id] })).statusCode).toBe(403);
    });

    it("keeps delete separate from update", async () => {
      const draft = await createDraft();
      expect((await asStaff("DELETE", `/cms/testimonials/${draft.id}`)).statusCode).toBe(403);
      expect((await asOwner("DELETE", `/cms/testimonials/${draft.id}`)).statusCode).toBe(204);
    });
  });

  describe("create", () => {
    it("saves a draft with defaults and the next position", async () => {
      const first = await createDraft({ name: `${marker} First` });
      const second = await createDraft({ name: `${marker} Second` });

      expect(first).toMatchObject({
        status: "draft",
        publishedAt: null,
        logo: null,
        consentConfirmed: false,
        logoInBlack: false,
        quote: "They automated our onboarding from end to end.",
        role: "Founder",
        company: "No Spain No Gain",
        service: "back-office-operations",
      });
      expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(second.sortOrder).toBeGreaterThan(first.sortOrder);
    });

    it("keeps the flags that are sent and trims the text", async () => {
      const created = await createDraft({
        name: `  ${marker} Padded  `,
        quote: "  Spaced out.  ",
        consentConfirmed: true,
        logoInBlack: true,
      });
      expect(created).toMatchObject({
        name: `${marker} Padded`,
        quote: "Spaced out.",
        consentConfirmed: true,
        logoInBlack: true,
      });
    });

    it("keeps text that is not plain ASCII", async () => {
      const created = await createDraft({ name: `${marker} মোহাম্মদ`, quote: "দারুণ কাজ — “très bien” 👍" });
      expect(created.quote).toBe("দারুণ কাজ — “très bien” 👍");
      expect((await asStaff("GET", `/cms/testimonials/${created.id}`)).json<TestimonialBody>().name).toBe(`${marker} মোহাম্মদ`);
    });

    it("accepts a 600-character quote and refuses 601", async () => {
      expect((await asStaff("POST", "/cms/testimonials", testimonial({ quote: "a".repeat(600) }))).statusCode).toBe(201);
      expect((await asStaff("POST", "/cms/testimonials", testimonial({ quote: "a".repeat(601) }))).statusCode).toBe(400);
    });

    it("rejects bad input", async () => {
      const bad = async (patch: Record<string, unknown>) =>
        (await asStaff("POST", "/cms/testimonials", testimonial(patch))).statusCode;
      expect(await bad({ service: "seo" })).toBe(400);
      expect(await bad({ quote: "   " })).toBe(400);
      expect(await bad({ quote: undefined })).toBe(400);
      expect(await bad({ name: undefined })).toBe(400);
      expect(await bad({ role: "" })).toBe(400);
      expect(await bad({ company: undefined })).toBe(400);
      expect(await bad({ consentConfirmed: "yes" })).toBe(400);
      expect(await bad({ logoInBlack: 1 })).toBe(400);
    });

    it("does not let the caller choose the status, position or logo", async () => {
      const created = (
        await asStaff(
          "POST",
          "/cms/testimonials",
          testimonial({ status: "published", sortOrder: -5, logoKey: "testimonial/x/logo1.png" }),
        )
      ).json<TestimonialBody>();
      expect(created.status).toBe("draft");
      expect(created.sortOrder).toBeGreaterThanOrEqual(0);
      expect(created.logo).toBeNull();
    });

    it("does not ask the website to refresh, because a draft is not on the site", async () => {
      await createDraft();
      expect(refreshes).not.toHaveBeenCalled();
    });
  });

  describe("read and edit", () => {
    it("lists in display order and filters by status", async () => {
      const draft = await createDraft({ name: `${marker} Filtered` });
      const drafts = await asStaff("GET", "/cms/testimonials?status=draft&pageSize=100");
      expect(drafts.statusCode).toBe(200);
      const items = drafts.json<{ items: TestimonialBody[] }>().items;
      expect(items.every((item) => item.status === "draft")).toBe(true);
      expect(items.map((item) => item.id)).toContain(draft.id);

      const published = await asStaff("GET", "/cms/testimonials?status=published&pageSize=100");
      expect(published.json<{ items: TestimonialBody[] }>().items.every((item) => item.status === "published")).toBe(true);

      const ordered = (await asStaff("GET", "/cms/testimonials?pageSize=100")).json<{ items: TestimonialBody[] }>().items;
      const orders = ordered.map((item) => item.sortOrder);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });

    it("searches name, company and quote, matching `%` literally", async () => {
      const draft = await createDraft({
        name: `${marker} Searchable`,
        company: `Zeta ${RUN} Holdings`,
        quote: `Needle ${RUN} in the quote.`,
      });
      const find = async (q: string) =>
        (await asStaff("GET", `/cms/testimonials?q=${encodeURIComponent(q)}`)).json<{
          items: TestimonialBody[];
          total: number;
        }>();

      expect((await find(`${marker} Searchable`)).items.map((item) => item.id)).toEqual([draft.id]);
      expect((await find(`Zeta ${RUN}`)).items.map((item) => item.id)).toEqual([draft.id]);
      expect((await find(`needle ${RUN}`)).items.map((item) => item.id)).toEqual([draft.id]);
      expect((await find(`${marker}%`)).total).toBe(0);
      expect((await find(`${marker}_`)).total).toBe(0);
    });

    it("sorts by name and by company, both ways", async () => {
      const a = await createDraft({ name: `${marker} Sort Alpha`, company: `Sort ${RUN} Bravo` });
      const b = await createDraft({ name: `${marker} Sort Zulu`, company: `Sort ${RUN} Alpha` });
      const ids = async (query: string) =>
        (await asStaff("GET", `/cms/testimonials?q=${encodeURIComponent(`${marker} Sort`)}&${query}`))
          .json<{ items: TestimonialBody[] }>()
          .items.map((item) => item.id);

      expect(await ids("sort=name&order=asc")).toEqual([a.id, b.id]);
      expect(await ids("sort=name&order=desc")).toEqual([b.id, a.id]);
      expect(await ids("sort=company&order=asc")).toEqual([b.id, a.id]);
    });

    it("pages and caps the page size", async () => {
      const page = await asStaff("GET", "/cms/testimonials?page=1&pageSize=1");
      expect(page.json<{ items: unknown[]; pageSize: number; page: number }>()).toMatchObject({ pageSize: 1, page: 1 });
      expect(page.json<{ items: unknown[] }>().items.length).toBeLessThanOrEqual(1);
      expect((await asStaff("GET", "/cms/testimonials?pageSize=101")).statusCode).toBe(400);
      expect((await asStaff("GET", "/cms/testimonials?page=0")).statusCode).toBe(400);
      expect((await asStaff("GET", "/cms/testimonials?sort=quote")).statusCode).toBe(400);
    });

    it("returns one testimonial, and 404 for an unknown id and 400 for a malformed one", async () => {
      const draft = await createDraft({ name: `${marker} Single` });
      const found = await asStaff("GET", `/cms/testimonials/${draft.id}`);
      expect(found.statusCode).toBe(200);
      expect(found.json<TestimonialBody>()).toEqual(draft);
      expect((await asStaff("GET", `/cms/testimonials/${randomUUID()}`)).statusCode).toBe(404);
      expect((await asStaff("GET", "/cms/testimonials/not-a-uuid")).statusCode).toBe(400);
    });

    it("edits some fields and leaves the rest", async () => {
      const draft = await createDraft({ name: `${marker} Editable` });
      const edited = await asStaff("PATCH", `/cms/testimonials/${draft.id}`, {
        quote: "A new quote.",
        service: "ad-tech",
        logoInBlack: true,
        consentConfirmed: true,
      });
      expect(edited.statusCode).toBe(200);
      expect(edited.json<TestimonialBody>()).toMatchObject({
        id: draft.id,
        name: `${marker} Editable`,
        role: "Founder",
        company: "No Spain No Gain",
        quote: "A new quote.",
        service: "ad-tech",
        logoInBlack: true,
        consentConfirmed: true,
        status: "draft",
      });
      expect(new Date(edited.json<TestimonialBody>().updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(draft.updatedAt).getTime(),
      );
    });

    it("refuses an empty change, bad values, fields it does not own and an unknown testimonial", async () => {
      const draft = await createDraft({ name: `${marker} Strict` });
      const patch = async (body: object) => (await asStaff("PATCH", `/cms/testimonials/${draft.id}`, body)).statusCode;
      expect(await patch({})).toBe(400);
      // status, position and logo columns are not editable here: they are ignored, so nothing is left to change
      expect(await patch({ status: "published" })).toBe(400);
      expect(await patch({ sortOrder: 0 })).toBe(400);
      expect(await patch({ logoKey: "x" })).toBe(400);
      expect(await patch({ quote: "a".repeat(601) })).toBe(400);
      expect(await patch({ name: "  " })).toBe(400);
      expect(await patch({ service: "seo" })).toBe(400);
      expect((await asStaff("PATCH", `/cms/testimonials/${randomUUID()}`, { quote: "x" })).statusCode).toBe(404);

      const unchanged = (await asStaff("GET", `/cms/testimonials/${draft.id}`)).json<TestimonialBody>();
      expect(unchanged).toEqual(draft);
    });

    it("asks the website to refresh after editing a live testimonial, but not a draft", async () => {
      const draft = await createReady({ name: `${marker} Edited Live` });
      await asStaff("PATCH", `/cms/testimonials/${draft.id}`, { quote: "Draft edit." });
      expect(refreshes).not.toHaveBeenCalled();

      await asStaff("POST", `/cms/testimonials/${draft.id}/publish`);
      refreshes.mockClear();
      expect((await asStaff("PATCH", `/cms/testimonials/${draft.id}`, { quote: "Live edit." })).statusCode).toBe(200);
      expect(refreshes).toHaveBeenCalledTimes(1);
    });
  });

  describe("publish and unpublish", () => {
    it("will not publish without the client's agreement", async () => {
      const draft = await createDraft({ name: `${marker} No Consent` });
      const refused = await asStaff("POST", `/cms/testimonials/${draft.id}/publish`);
      expect(refused.statusCode).toBe(400);
      expect(refused.json<{ message: string }>().message).toMatch(/agreed/i);
      expect(refused.json<{ details: Record<string, string> }>().details).toHaveProperty("consentConfirmed");
      expect((await asStaff("GET", `/cms/testimonials/${draft.id}`)).json<TestimonialBody>().status).toBe("draft");
      expect(refreshes).not.toHaveBeenCalled();
    });

    it("publishes once the agreement is recorded, with no logo needed", async () => {
      const draft = await createDraft({ name: `${marker} Goes Live` });
      await asStaff("PATCH", `/cms/testimonials/${draft.id}`, { consentConfirmed: true });

      const published = await asStaff("POST", `/cms/testimonials/${draft.id}/publish`);
      expect(published.statusCode).toBe(200);
      const body = published.json<TestimonialBody>();
      expect(body.status).toBe("published");
      expect(body.publishedAt).not.toBeNull();
      expect(body.logo).toBeNull();
      expect(refreshes).toHaveBeenCalledTimes(1);

      expect((await asStaff("POST", `/cms/testimonials/${draft.id}/publish`)).statusCode).toBe(409);
    });

    it("unpublishes back to a draft and keeps the first publish date when it goes live again", async () => {
      const draft = await createReady({ name: `${marker} Round Trip` });
      const first = (await asStaff("POST", `/cms/testimonials/${draft.id}/publish`)).json<TestimonialBody>();
      refreshes.mockClear();

      const unpublished = await asStaff("POST", `/cms/testimonials/${draft.id}/unpublish`);
      expect(unpublished.statusCode).toBe(200);
      expect(unpublished.json<TestimonialBody>().status).toBe("draft");
      expect(unpublished.json<TestimonialBody>().publishedAt).toBe(first.publishedAt);
      expect(refreshes).toHaveBeenCalledTimes(1);
      expect((await asStaff("POST", `/cms/testimonials/${draft.id}/unpublish`)).statusCode).toBe(409);

      const again = (await asStaff("POST", `/cms/testimonials/${draft.id}/publish`)).json<TestimonialBody>();
      expect(again.publishedAt).toBe(first.publishedAt);
    });

    it("404s for an unknown testimonial", async () => {
      expect((await asStaff("POST", `/cms/testimonials/${randomUUID()}/publish`)).statusCode).toBe(404);
      expect((await asStaff("POST", `/cms/testimonials/${randomUUID()}/unpublish`)).statusCode).toBe(404);
    });

    it("will not withdraw the agreement from a live testimonial, but allows it once unpublished", async () => {
      const draft = await createReady({ name: `${marker} Withdraw` });
      await asStaff("POST", `/cms/testimonials/${draft.id}/publish`);

      const refused = await asStaff("PATCH", `/cms/testimonials/${draft.id}`, { consentConfirmed: false });
      expect(refused.statusCode).toBe(409);
      expect(refused.json<{ message: string }>().message).toMatch(/unpublish/i);
      expect((await asStaff("GET", `/cms/testimonials/${draft.id}`)).json<TestimonialBody>().consentConfirmed).toBe(true);

      // Confirming again, or any other edit, is fine while live
      expect((await asStaff("PATCH", `/cms/testimonials/${draft.id}`, { consentConfirmed: true })).statusCode).toBe(200);

      await asStaff("POST", `/cms/testimonials/${draft.id}/unpublish`);
      const withdrawn = await asStaff("PATCH", `/cms/testimonials/${draft.id}`, { consentConfirmed: false });
      expect(withdrawn.statusCode).toBe(200);
      expect(withdrawn.json<TestimonialBody>().consentConfirmed).toBe(false);
      // and then it cannot go live again without it
      expect((await asStaff("POST", `/cms/testimonials/${draft.id}/publish`)).statusCode).toBe(400);
    });

    it("is backed by the database: a published row cannot lack the agreement", async () => {
      const draft = await createDraft({ name: `${marker} Constraint` });
      await expect(
        pool.query(`update cms.testimonials set status = 'published' where id = $1::uuid`, [draft.id]),
      ).rejects.toThrow(/testimonials_published_consent_check/);
    });

    it("is backed by the database: bad status, service, quote length and half a logo are refused", async () => {
      const draft = await createDraft({ name: `${marker} Checks` });
      const attempt = (set: string) => pool.query(`update cms.testimonials set ${set} where id = $1::uuid`, [draft.id]);
      await expect(attempt(`status = 'archived'`)).rejects.toThrow(/testimonials_status_check/);
      await expect(attempt(`service = 'seo'`)).rejects.toThrow(/testimonials_service_check/);
      await expect(attempt(`quote = ''`)).rejects.toThrow(/testimonials_quote_check/);
      await expect(attempt(`quote = repeat('a', 601)`)).rejects.toThrow(/testimonials_quote_check/);
      await expect(attempt(`logo_key = 'testimonial/x/logo1.png'`)).rejects.toThrow(/testimonials_logo_check/);
      await expect(
        attempt(`logo_key = 'testimonial/x/logo1.png', logo_width = 10, logo_height = 10, logo_size = 10`),
      ).rejects.toThrow(/testimonials_logo_check/);
    });

    it("shows a stored logo as a full public address, never the key", async () => {
      const draft = await createDraft({ name: `${marker} With Logo` });
      await pool.query(
        `update cms.testimonials set logo_key = $2, logo_width = 320, logo_height = 72, logo_size = 1000, logo_type = 'image/png' where id = $1::uuid`,
        [draft.id, `testimonial/${draft.id}/logo1.png`],
      );
      const body = (await asStaff("GET", `/cms/testimonials/${draft.id}`)).json<TestimonialBody>();
      expect(body.logo).toEqual({ url: `https://public.test/testimonial/${draft.id}/logo1.png`, width: 320, height: 72 });
      expect(JSON.stringify(body)).not.toContain('"logoKey"');
    });
  });

  describe("order", () => {
    it("sets the order from the full list, returns it, and asks the website to refresh", async () => {
      const a = await createDraft({ name: `${marker} Order A` });
      const b = await createDraft({ name: `${marker} Order B` });
      const c = await createDraft({ name: `${marker} Order C` });
      const ours = [a.id, b.id, c.id];

      const all = (await asStaff("GET", "/cms/testimonials?pageSize=100"))
        .json<{ items: TestimonialBody[] }>()
        .items.map((item) => item.id);
      // Keep every other testimonial where it is and only reverse our three, so shared data keeps its relative order.
      const reversed = [...ours].reverse();
      let next = 0;
      const wanted = all.map((id) => (ours.includes(id) ? reversed[next++]! : id));

      refreshes.mockClear();
      const response = await asStaff("PUT", "/cms/testimonials/order", { ids: wanted });
      expect(response.statusCode).toBe(200);
      const items = response.json<{ items: TestimonialBody[] }>().items;
      expect(items.map((item) => item.id)).toEqual(wanted);
      expect(items.map((item) => item.sortOrder)).toEqual(wanted.map((_, position) => position));
      expect(refreshes).toHaveBeenCalledTimes(1);
    });

    it("refuses a list that is missing a testimonial, repeats one, or names an unknown one", async () => {
      const all = (await asStaff("GET", "/cms/testimonials?pageSize=100"))
        .json<{ items: TestimonialBody[] }>()
        .items.map((item) => item.id);
      const send = async (ids: string[]) => (await asStaff("PUT", "/cms/testimonials/order", { ids })).statusCode;

      expect(await send(all.slice(1))).toBe(400);
      expect(await send([...all, all[0]!])).toBe(400);
      expect(await send([...all.slice(1), randomUUID()])).toBe(400);
      expect(await send([])).toBe(400);
      expect(await send(["not-a-uuid"])).toBe(400);
    });

    it("puts a new testimonial last after a reorder", async () => {
      const added = await createDraft({ name: `${marker} Last After Reorder` });
      const ordered = (await asStaff("GET", "/cms/testimonials?pageSize=100")).json<{ items: TestimonialBody[] }>().items;
      expect(ordered[ordered.length - 1]!.id).toBe(added.id);
    });
  });

  describe("delete", () => {
    it("deletes a draft for good", async () => {
      const draft = await createDraft({ name: `${marker} Remove Me` });
      expect((await asOwner("DELETE", `/cms/testimonials/${draft.id}`)).statusCode).toBe(204);
      expect((await asOwner("GET", `/cms/testimonials/${draft.id}`)).statusCode).toBe(404);
      expect((await asOwner("DELETE", `/cms/testimonials/${draft.id}`)).statusCode).toBe(404);
      // A draft was never on the site, so there is nothing for the website to refresh
      expect(refreshes).not.toHaveBeenCalled();
    });

    it("refuses to delete a published testimonial until it is unpublished", async () => {
      const draft = await createReady({ name: `${marker} Live One` });
      await asStaff("POST", `/cms/testimonials/${draft.id}/publish`);

      const refused = await asOwner("DELETE", `/cms/testimonials/${draft.id}`);
      expect(refused.statusCode).toBe(409);
      expect((await asOwner("GET", `/cms/testimonials/${draft.id}`)).statusCode).toBe(200);

      await asStaff("POST", `/cms/testimonials/${draft.id}/unpublish`);
      expect((await asOwner("DELETE", `/cms/testimonials/${draft.id}`)).statusCode).toBe(204);
    });

    it("404s for an unknown or malformed id", async () => {
      expect((await asOwner("DELETE", `/cms/testimonials/${randomUUID()}`)).statusCode).toBe(404);
      expect((await asOwner("DELETE", "/cms/testimonials/not-a-uuid")).statusCode).toBe(400);
    });
  });

  describe("two employees at once", () => {
    it("lets only one of two simultaneous publishes win", async () => {
      const draft = await createReady({ name: `${marker} Race` });
      const results = await Promise.all([
        asStaff("POST", `/cms/testimonials/${draft.id}/publish`),
        asOwner("POST", `/cms/testimonials/${draft.id}/publish`),
      ]);
      expect(results.map((result) => result.statusCode).sort()).toEqual([200, 409]);
    });
  });

  describe("logo", () => {
    interface UploadOptions {
      field?: string;
      filename?: string;
      type?: string;
      cookie?: string;
    }
    /** Builds the admin's multipart request: files only, the logo has no other field. */
    function multipart(files: { field: string; filename: string; type: string; body: Buffer }[]) {
      const boundary = `----e2e${randomUUID()}`;
      const chunks: Buffer[] = [];
      for (const file of files) {
        chunks.push(
          Buffer.from(
            `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.filename}"\r\nContent-Type: ${file.type}\r\n\r\n`,
          ),
          file.body,
          Buffer.from("\r\n"),
        );
      }
      chunks.push(Buffer.from(`--${boundary}--\r\n`));
      return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
    }
    const upload = (id: string, file: Buffer | null, options: UploadOptions = {}) => {
      const files = file
        ? [
            {
              field: options.field ?? "logo",
              filename: options.filename ?? "logo.png",
              type: options.type ?? "image/png",
              body: file,
            },
          ]
        : [];
      const form = multipart(files);
      return app.inject({
        method: "PUT",
        url: `/api/v1/cms/testimonials/${id}/logo`,
        payload: form.body,
        headers: { "content-type": form.contentType, cookie: options.cookie ?? staffCookie },
      });
    };
    const logoRow = async (id: string) => {
      const { rows } = await pool.query<{
        logo_key: string | null;
        logo_width: number | null;
        logo_height: number | null;
        logo_size: number | null;
        logo_type: string | null;
      }>(`select logo_key, logo_width, logo_height, logo_size, logo_type from cms.testimonials where id = $1::uuid`, [id]);
      return rows[0]!;
    };

    it("uploads a logo: type and size come from the bytes, the file is public and immutable, the key stays private", async () => {
      const draft = await createDraft({ name: `${marker} Logo Up` });
      const file = png(320, 72, 100);
      const response = await upload(draft.id, file);

      expect(response.statusCode).toBe(200);
      const body = response.json<TestimonialBody>();
      expect(body.logo).toEqual({ url: `https://public.test/testimonial/${draft.id}/logo1.png`, width: 320, height: 72 });
      expect(JSON.stringify(body)).not.toContain('"logoKey"');
      expect(keysUnder(draft.id)).toEqual([`testimonial/${draft.id}/logo1.png`]);
      const stored = objects.get(`testimonial/${draft.id}/logo1.png`)!;
      expect(stored.body.equals(file)).toBe(true);
      expect(stored.contentType).toBe("image/png");
      expect(stored.cacheControl).toBe("public, max-age=31536000, immutable");
      expect(await logoRow(draft.id)).toEqual({
        logo_key: `testimonial/${draft.id}/logo1.png`,
        logo_width: 320,
        logo_height: 72,
        logo_size: file.length,
        logo_type: "image/png",
      });
    });

    it("replaces the logo under a new number and extension, and deletes the old file", async () => {
      const draft = await createDraft({ name: `${marker} Logo Replace` });
      await upload(draft.id, png(320, 72));
      const response = await upload(draft.id, jpeg(400, 100), { filename: "other.jpg", type: "image/jpeg" });

      expect(response.statusCode).toBe(200);
      expect(response.json<TestimonialBody>().logo).toEqual({
        url: `https://public.test/testimonial/${draft.id}/logo2.jpg`,
        width: 400,
        height: 100,
      });
      expect(keysUnder(draft.id)).toEqual([`testimonial/${draft.id}/logo2.jpg`]);

      const third = await upload(draft.id, webp(500, 120));
      expect(third.json<TestimonialBody>().logo?.url).toMatch(/logo3\.webp$/);
      expect(keysUnder(draft.id)).toEqual([`testimonial/${draft.id}/logo3.webp`]);
    });

    it("never trusts the file name or the type the client sent", async () => {
      const draft = await createDraft({ name: `${marker} Logo Fake` });
      const text = await upload(draft.id, Buffer.from("this is only text, whatever it is called"));
      expect(text.statusCode).toBe(400);
      expect(text.json<{ message: string }>().message).toMatch(/PNG, JPEG or WebP/);

      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      expect((await upload(draft.id, svg, { filename: "logo.png", type: "image/png" })).statusCode).toBe(400);
      expect((await upload(draft.id, svg, { filename: "logo.svg", type: "image/svg+xml" })).statusCode).toBe(400);
      expect(keysUnder(draft.id)).toEqual([]);

      // A real PNG is accepted whatever it is called
      const odd = await upload(draft.id, png(320, 72), { filename: "logo.txt", type: "text/plain" });
      expect(odd.statusCode).toBe(200);
      expect(odd.json<TestimonialBody>().logo?.url).toMatch(/logo1\.png$/);
    });

    it("refuses an empty file, one over 5 MB, a missing file, the wrong field, two files and a non-multipart request", async () => {
      const draft = await createDraft({ name: `${marker} Logo Bad` });
      const empty = await upload(draft.id, Buffer.alloc(0));
      expect(empty.statusCode).toBe(400);

      const big = await upload(draft.id, png(320, 72, 5 * 1024 * 1024));
      expect(big.statusCode).toBe(400);
      expect(big.json<{ message: string }>().message).toMatch(/5 MB/);

      expect((await upload(draft.id, null)).statusCode).toBe(400);
      expect((await upload(draft.id, png(320, 72), { field: "image" })).statusCode).toBe(400);

      const two = multipart([
        { field: "logo", filename: "a.png", type: "image/png", body: png(320, 72) },
        { field: "logo", filename: "b.png", type: "image/png", body: png(320, 72) },
      ]);
      const twice = await app.inject({
        method: "PUT",
        url: `/api/v1/cms/testimonials/${draft.id}/logo`,
        payload: two.body,
        headers: { "content-type": two.contentType, cookie: staffCookie },
      });
      expect(twice.statusCode).toBe(400);

      const notForm = await app.inject({
        method: "PUT",
        url: `/api/v1/cms/testimonials/${draft.id}/logo`,
        payload: { logo: "x" },
        headers: { cookie: staffCookie },
      });
      expect(notForm.statusCode).toBe(400);
      expect(keysUnder(draft.id)).toEqual([]);
      expect((await logoRow(draft.id)).logo_key).toBeNull();
    });

    it("404s for an unknown testimonial without storing anything, and 400s for a malformed id", async () => {
      const before = objects.size;
      expect((await upload(randomUUID(), png(320, 72))).statusCode).toBe(404);
      expect(objects.size).toBe(before);
      expect((await upload("not-a-uuid", png(320, 72))).statusCode).toBe(400);
    });

    it("needs a session and the update permission", async () => {
      const draft = await createDraft({ name: `${marker} Logo Access` });
      const noSession = await app.inject({ method: "PUT", url: `/api/v1/cms/testimonials/${draft.id}/logo` });
      expect(noSession.statusCode).toBe(401);
      expect((await app.inject({ method: "DELETE", url: `/api/v1/cms/testimonials/${draft.id}/logo` })).statusCode).toBe(401);
      expect((await upload(draft.id, png(320, 72), { cookie: readerCookie })).statusCode).toBe(403);
      expect((await upload(draft.id, png(320, 72), { cookie: guestCookie })).statusCode).toBe(403);
      expect((await api("DELETE", `/cms/testimonials/${draft.id}/logo`, { cookie: readerCookie })).statusCode).toBe(403);
      expect(keysUnder(draft.id)).toEqual([]);
    });

    it("stores nothing and leaves the testimonial as it was when storage is down", async () => {
      const draft = await createDraft({ name: `${marker} Logo Down` });
      jest.spyOn(app.get(StorageService), "putPublicIfAbsent").mockRejectedValueOnce(new StorageUnavailableError());

      expect((await upload(draft.id, png(320, 72))).statusCode).toBe(503);
      expect(keysUnder(draft.id)).toEqual([]);
      expect((await asStaff("GET", `/cms/testimonials/${draft.id}`)).json<TestimonialBody>().logo).toBeNull();
    });

    it("removes the new file again when the database update fails", async () => {
      const draft = await createDraft({ name: `${marker} Logo Rollback` });
      await upload(draft.id, png(320, 72));
      const before = await logoRow(draft.id);
      jest.spyOn(app.get(AuditService), "record").mockRejectedValueOnce(new Error("database went away"));

      expect((await upload(draft.id, jpeg(400, 100))).statusCode).toBe(500);
      expect(await logoRow(draft.id)).toEqual(before);
      expect(keysUnder(draft.id)).toEqual([`testimonial/${draft.id}/logo1.png`]);
    });

    it("still succeeds when the replaced file cannot be deleted, leaving an orphan that later uploads skip", async () => {
      const draft = await createDraft({ name: `${marker} Logo Stuck` });
      await upload(draft.id, png(320, 72));
      jest.spyOn(app.get(StorageService), "deletePublic").mockRejectedValueOnce(new StorageUnavailableError());

      const response = await upload(draft.id, jpeg(400, 100));
      expect(response.statusCode).toBe(200);
      expect(response.json<TestimonialBody>().logo?.url).toMatch(/logo2\.jpg$/);
      expect(keysUnder(draft.id).sort()).toEqual([`testimonial/${draft.id}/logo1.png`, `testimonial/${draft.id}/logo2.jpg`]);

      await upload(draft.id, webp(500, 120));
      expect((await logoRow(draft.id)).logo_key).toBe(`testimonial/${draft.id}/logo3.webp`);
    });

    it("ends with exactly one file, the one the row points at, when two uploads arrive together", async () => {
      const draft = await createDraft({ name: `${marker} Logo Race` });
      const [a, b] = await Promise.all([upload(draft.id, png(320, 72)), upload(draft.id, jpeg(400, 100))]);
      expect([a.statusCode, b.statusCode]).toEqual([200, 200]);

      const keys = keysUnder(draft.id);
      expect(keys).toHaveLength(1);
      expect((await logoRow(draft.id)).logo_key).toBe(keys[0]);
    });

    it("keeps a published testimonial published, and asks the website to refresh only when it is live", async () => {
      const draft = await createReady({ name: `${marker} Logo Live` });
      await upload(draft.id, png(320, 72));
      expect(refreshes).not.toHaveBeenCalled();

      expect((await asStaff("POST", `/cms/testimonials/${draft.id}/publish`)).statusCode).toBe(200);
      refreshes.mockClear();
      const replaced = await upload(draft.id, jpeg(400, 100));
      expect(replaced.json<TestimonialBody>().status).toBe("published");
      expect(refreshes).toHaveBeenCalledTimes(1);
    });

    it("removes the logo and its file; a live testimonial stays live and the card falls back to the company name", async () => {
      const draft = await createReady({ name: `${marker} Logo Remove` });
      await upload(draft.id, png(320, 72));
      await asStaff("POST", `/cms/testimonials/${draft.id}/publish`);
      refreshes.mockClear();

      const response = await asStaff("DELETE", `/cms/testimonials/${draft.id}/logo`);
      expect(response.statusCode).toBe(200);
      expect(response.json<TestimonialBody>()).toMatchObject({ status: "published", logo: null });
      expect(keysUnder(draft.id)).toEqual([]);
      expect(await logoRow(draft.id)).toEqual({
        logo_key: null,
        logo_width: null,
        logo_height: null,
        logo_size: null,
        logo_type: null,
      });
      expect(refreshes).toHaveBeenCalledTimes(1);

      // Nothing left to remove: not an error, nothing changes, no refresh
      refreshes.mockClear();
      expect((await asStaff("DELETE", `/cms/testimonials/${draft.id}/logo`)).statusCode).toBe(200);
      expect(refreshes).not.toHaveBeenCalled();

      // A new logo can be added again, from number 1 because the folder is empty
      const again = await upload(draft.id, png(320, 72));
      expect(again.json<TestimonialBody>().logo?.url).toMatch(/logo1\.png$/);
    });

    it("404s when removing the logo of an unknown testimonial", async () => {
      expect((await asStaff("DELETE", `/cms/testimonials/${randomUUID()}/logo`)).statusCode).toBe(404);
      expect((await asStaff("DELETE", `/cms/testimonials/not-a-uuid/logo`)).statusCode).toBe(400);
    });

    it("still removes the logo from the row when its file cannot be deleted", async () => {
      const draft = await createDraft({ name: `${marker} Logo Remove Stuck` });
      await upload(draft.id, png(320, 72));
      jest.spyOn(app.get(StorageService), "deletePublic").mockRejectedValueOnce(new StorageUnavailableError());

      const response = await asStaff("DELETE", `/cms/testimonials/${draft.id}/logo`);
      expect(response.statusCode).toBe(200);
      expect(response.json<TestimonialBody>().logo).toBeNull();
      expect(keysUnder(draft.id)).toHaveLength(1);
    });

    it("writes audit entries with the type and size only, never the file name or key", async () => {
      const draft = await createDraft({ name: `${marker} Logo Audit` });
      await upload(draft.id, png(320, 72), { filename: `private-name-${RUN}.png` });
      await upload(draft.id, jpeg(400, 100));
      await asStaff("DELETE", `/cms/testimonials/${draft.id}/logo`);

      const { rows } = await pool.query<{ action: string; metadata: Record<string, unknown> | null }>(
        `select action, metadata from core.audit_log where entity_id = $1 and action like 'cms.testimonial.logo_%' order by occurred_at, id`,
        [draft.id],
      );
      expect(rows).toEqual([
        { action: "cms.testimonial.logo_replaced", metadata: { replaced: false, type: "image/png", size: png(320, 72).length } },
        {
          action: "cms.testimonial.logo_replaced",
          metadata: { replaced: true, type: "image/jpeg", size: jpeg(400, 100).length },
        },
        { action: "cms.testimonial.logo_removed", metadata: null },
      ]);
      expect(JSON.stringify(rows)).not.toContain(RUN);
      expect(JSON.stringify(rows)).not.toContain("testimonial/");
    });
  });

  describe("deleting a testimonial's files", () => {
    const putLogo = async (id: string) => {
      const form = Buffer.concat([
        Buffer.from(`--b\r\nContent-Disposition: form-data; name="logo"; filename="l.png"\r\nContent-Type: image/png\r\n\r\n`),
        png(320, 72),
        Buffer.from("\r\n--b--\r\n"),
      ]);
      const response = await app.inject({
        method: "PUT",
        url: `/api/v1/cms/testimonials/${id}/logo`,
        payload: form,
        headers: { "content-type": "multipart/form-data; boundary=b", cookie: staffCookie },
      });
      expect(response.statusCode).toBe(200);
    };

    it("removes the whole logo folder with the testimonial, and only that testimonial's", async () => {
      const gone = await createDraft({ name: `${marker} Del Files` });
      const kept = await createDraft({ name: `${marker} Del Keep` });
      await putLogo(gone.id);
      await putLogo(kept.id);
      objects.set(`testimonial/${gone.id}/logo9.png`, { body: Buffer.from("orphan"), contentType: "image/png" });

      expect((await asOwner("DELETE", `/cms/testimonials/${gone.id}`)).statusCode).toBe(204);
      expect(keysUnder(gone.id)).toEqual([]);
      expect(keysUnder(kept.id)).toHaveLength(1);
    });

    it("refuses to delete a published testimonial and keeps its files", async () => {
      const live = await createReady({ name: `${marker} Del Live` });
      await putLogo(live.id);
      await asStaff("POST", `/cms/testimonials/${live.id}/publish`);

      expect((await asOwner("DELETE", `/cms/testimonials/${live.id}`)).statusCode).toBe(409);
      expect(keysUnder(live.id)).toHaveLength(1);
    });

    it("still deletes the testimonial when its files cannot be removed (they become an orphan folder)", async () => {
      const draft = await createDraft({ name: `${marker} Del Stuck` });
      await putLogo(draft.id);
      jest.spyOn(app.get(StorageService), "deletePublicPrefix").mockRejectedValueOnce(new StorageUnavailableError());

      expect((await asOwner("DELETE", `/cms/testimonials/${draft.id}`)).statusCode).toBe(204);
      expect((await asOwner("GET", `/cms/testimonials/${draft.id}`)).statusCode).toBe(404);
      expect(keysUnder(draft.id)).toHaveLength(1);
    });
  });

  describe("public endpoint", () => {
    /** Uploads a PNG logo as staff. */
    const upload = (id: string, file: Buffer) => {
      const form = Buffer.concat([
        Buffer.from('--b\r\nContent-Disposition: form-data; name="logo"; filename="l.png"\r\nContent-Type: image/png\r\n\r\n'),
        file,
        Buffer.from("\r\n--b--\r\n"),
      ]);
      return app.inject({
        method: "PUT",
        url: `/api/v1/cms/testimonials/${id}/logo`,
        payload: form,
        headers: { "content-type": "multipart/form-data; boundary=b", cookie: staffCookie },
      });
    };
    const publicApi = () => app.inject({ method: "GET", url: "/api/v1/cms/public/testimonials" });
    interface PublicItem {
      quote: string;
      name: string;
      role: string;
      company: string;
      service: string;
      logoInBlack: boolean;
      logo: { url: string; width: number; height: number } | null;
    }
    // The cap test adds 55 rows and this block leaves many published ones: remove them so later tests that list every
    // testimonial (the reorder checks) still fit in one page.
    afterAll(async () => {
      await pool.query(
        `delete from core.audit_log where entity_id in (select id::text from cms.testimonials where name like $1)`,
        [`${marker}%`],
      );
      await pool.query(`delete from cms.testimonials where name like $1`, [`${marker}%`]);
    });
    const names = async () => (await publicApi()).json<{ items: PublicItem[] }>().items.map((item) => item.name);

    it("needs no session, lists only published testimonials in display order, and hides drafts and unpublished ones", async () => {
      const first = await createReady({ name: `${marker} Pub First` });
      const draft = await createReady({ name: `${marker} Pub Draft` });
      const second = await createReady({ name: `${marker} Pub Second` });
      const off = await createReady({ name: `${marker} Pub Off` });
      for (const item of [first, second, off]) await asStaff("POST", `/cms/testimonials/${item.id}/publish`);
      await asStaff("POST", `/cms/testimonials/${off.id}/unpublish`);

      const response = await publicApi();
      expect(response.statusCode).toBe(200);
      const listed = await names();
      expect(listed).toContain(first.name);
      expect(listed).toContain(second.name);
      expect(listed).not.toContain(draft.name);
      expect(listed).not.toContain(off.name);
      expect(listed.indexOf(first.name)).toBeLessThan(listed.indexOf(second.name));
    });

    it("returns only the allow-listed fields: no id, status, consent flag, audit columns or bucket key", async () => {
      const item = await createReady({ name: `${marker} Pub Shape`, logoInBlack: true });
      await upload(item.id, png(320, 72));
      await asStaff("POST", `/cms/testimonials/${item.id}/publish`);

      const found = (await publicApi()).json<{ items: PublicItem[] }>().items.find((entry) => entry.name === item.name)!;
      expect(Object.keys(found).sort()).toEqual(["company", "logo", "logoInBlack", "name", "quote", "role", "service"]);
      expect(found).toMatchObject({ logoInBlack: true, service: "back-office-operations" });
      expect(found.logo).toEqual({ url: `https://public.test/testimonial/${item.id}/logo1.png`, width: 320, height: 72 });
      const text = JSON.stringify(found);
      expect(text).not.toContain('"id"');
      expect(text).not.toMatch(/consent|status|createdBy|updatedBy|logoKey|sortOrder/);
    });

    it("shows a null logo when there is none, and follows a logo being removed", async () => {
      const bare = await createReady({ name: `${marker} Pub Bare` });
      await asStaff("POST", `/cms/testimonials/${bare.id}/publish`);
      const withLogo = await createReady({ name: `${marker} Pub Removed` });
      await upload(withLogo.id, png(320, 72));
      await asStaff("POST", `/cms/testimonials/${withLogo.id}/publish`);

      const items = () => publicApi().then((response) => response.json<{ items: PublicItem[] }>().items);
      expect((await items()).find((entry) => entry.name === bare.name)!.logo).toBeNull();
      expect((await items()).find((entry) => entry.name === withLogo.name)!.logo).not.toBeNull();

      await asStaff("DELETE", `/cms/testimonials/${withLogo.id}/logo`);
      expect((await items()).find((entry) => entry.name === withLogo.name)!.logo).toBeNull();
    });

    it("returns at most 50 testimonials", async () => {
      await pool.query(
        `insert into cms.testimonials (id, status, sort_order, published_at, quote, name, role, company, service, consent_confirmed)
         select gen_random_uuid(), 'published', 100000 + n, now(), 'Quote', $1 || ' Cap ' || n, 'Role', 'Company', 'back-office-operations', true
         from generate_series(1, 55) as n`,
        [marker],
      );
      const items = (await publicApi()).json<{ items: PublicItem[] }>().items;
      expect(items).toHaveLength(50);
    });
  });

  describe("audit", () => {
    it("records what happened with the id and field names, never the personal data", async () => {
      const secretQuote = `Confidential ${RUN} quote`;
      const secretName = `${marker} Hidden Person`;
      const secretCompany = `Hidden ${RUN} Company`;
      const draft = await createDraft({ name: secretName, quote: secretQuote, company: secretCompany, consentConfirmed: true });
      await asStaff("PATCH", `/cms/testimonials/${draft.id}`, { role: `Secret ${RUN} Role`, logoInBlack: true });
      await asStaff("POST", `/cms/testimonials/${draft.id}/publish`);
      await asStaff("POST", `/cms/testimonials/${draft.id}/unpublish`);
      await asOwner("DELETE", `/cms/testimonials/${draft.id}`);

      const { rows } = await pool.query<{ action: string; actor_id: string; metadata: Record<string, unknown> | null }>(
        `select action, actor_id, metadata from core.audit_log where entity_id = $1 order by occurred_at, id`,
        [draft.id],
      );
      expect(rows.map((row) => row.action)).toEqual([
        "cms.testimonial.created",
        "cms.testimonial.updated",
        "cms.testimonial.published",
        "cms.testimonial.unpublished",
        "cms.testimonial.deleted",
      ]);
      expect(rows[1]!.metadata).toEqual({ fields: ["role", "logoInBlack"] });
      expect(rows.every((row) => Boolean(row.actor_id))).toBe(true);

      const everything = JSON.stringify(rows);
      expect(everything).not.toContain(secretQuote);
      expect(everything).not.toContain(secretName);
      expect(everything).not.toContain(secretCompany);
      expect(everything).not.toContain(`Secret ${RUN} Role`);
      expect(everything).not.toContain(marker);
    });

    it("records a reorder without any text", async () => {
      const a = await createDraft({ name: `${marker} Audit Order` });
      const all = (await asStaff("GET", "/cms/testimonials?pageSize=100"))
        .json<{ items: TestimonialBody[] }>()
        .items.map((item) => item.id);
      await asStaff("PUT", "/cms/testimonials/order", { ids: all });
      const { rows } = await pool.query<{ metadata: Record<string, unknown> }>(
        `select metadata from core.audit_log where action = 'cms.testimonial.reordered' order by occurred_at desc limit 1`,
      );
      expect(rows[0]!.metadata).toEqual({ count: all.length });
      expect(all).toContain(a.id);
    });
  });
});
