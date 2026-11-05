import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { SITE_METRICS } from "../src/modules/cms/domain/site-metric";
import { users } from "../src/shared/auth/auth.schema";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";
import { WebsiteRevalidator } from "../src/shared/website/website-revalidator";

// The site metric endpoints against a real, migrated PostgreSQL (backend/RULES.md section 6). It creates its own users and roles
// and puts every figure back to what it was afterwards. Skipped unless TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://… npm test -- site-metrics.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";
const RUN = randomUUID().slice(0, 8);

interface MetricBody {
  key: string;
  title: string;
  kind: string;
  hint: string;
  placements: { page: string; route: string; section: string }[];
  value: string;
  defaultValue: string;
  updatedAt: string | null;
}

describeWithDb("CMS site metrics (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const editorEmail = `e2e-met-editor-${RUN}@test.invalid`;
  const readerEmail = `e2e-met-reader-${RUN}@test.invalid`;
  const guestEmail = `e2e-met-guest-${RUN}@test.invalid`;
  const roleNames = [`e2e-met-editor-${RUN}`, `e2e-met-read-${RUN}`, `e2e-met-none-${RUN}`];
  let editorCookie = "";
  let readerCookie = "";
  let guestCookie = "";
  let refreshes: jest.SpyInstance;
  let before: { key: string; value: string }[] = [];

  type Method = "GET" | "PATCH";
  const api = (method: Method, url: string, options: { payload?: object; cookie?: string } = {}) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      payload: options.payload,
      headers: options.cookie ? { cookie: options.cookie } : {},
    });

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
    process.env.RATE_LIMIT_MAX = "100000";
    pool = new Pool({ connectionString: databaseUrl, max: 2 });
    const db = drizzle({ client: pool });
    const { hashPassword } = await import("better-auth/crypto");
    const hash = await hashPassword(PASSWORD);
    before = (await pool.query<{ key: string; value: string }>("select key, value from cms.site_metrics")).rows;

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
    await makeUser(editorEmail, roleNames[0]!, ["cms.metric.read", "cms.metric.update"]);
    await makeUser(readerEmail, roleNames[1]!, ["cms.metric.read"]);
    // Testimonial permissions must not open the metric endpoints.
    await makeUser(guestEmail, roleNames[2]!, ["cms.testimonial.read", "cms.testimonial.update"]);

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    refreshes = jest.spyOn(app.get(WebsiteRevalidator), "siteMetricsChanged").mockResolvedValue();

    editorCookie = await signIn(editorEmail);
    readerCookie = await signIn(readerEmail);
    guestCookie = await signIn(guestEmail);
  });

  beforeEach(() => refreshes.mockClear());

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    // Put every figure back to what it was before the run (the suites share the database).
    await pool.query("delete from cms.site_metrics");
    for (const row of before) await pool.query("insert into cms.site_metrics (key, value) values ($1, $2)", [row.key, row.value]);
    await pool.query(
      `delete from core.audit_log where action = 'cms.site_metric.updated' and actor_id in (select id from core.users where email like $1)`,
      [`e2e-met-%-${RUN}@test.invalid`],
    );
    await db.delete(users).where(like(users.email, `e2e-met-%-${RUN}@test.invalid`));
    for (const name of roleNames) await db.delete(roles).where(eq(roles.name, name));
    await pool.end();
  });

  describe("access", () => {
    it("needs a session", async () => {
      expect((await api("GET", "/cms/site-metrics")).statusCode).toBe(401);
      expect((await api("PATCH", "/cms/site-metrics/years_experience", { payload: { value: "6+" } })).statusCode).toBe(401);
    });

    it("refuses an employee without the permission", async () => {
      expect((await api("GET", "/cms/site-metrics", { cookie: guestCookie })).statusCode).toBe(403);
      expect(
        (await api("PATCH", "/cms/site-metrics/years_experience", { payload: { value: "6+" }, cookie: guestCookie })).statusCode,
      ).toBe(403);
    });

    it("lets a reader read but not change", async () => {
      expect((await api("GET", "/cms/site-metrics", { cookie: readerCookie })).statusCode).toBe(200);
      const patch = await api("PATCH", "/cms/site-metrics/years_experience", { payload: { value: "6+" }, cookie: readerCookie });
      expect(patch.statusCode).toBe(403);
      expect(refreshes).not.toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("returns every slot with its title and the pages where it appears", async () => {
      const response = await api("GET", "/cms/site-metrics", { cookie: editorCookie });
      expect(response.statusCode).toBe(200);
      const { items } = response.json<{ items: MetricBody[] }>();
      expect(items.map((item) => item.key)).toEqual(SITE_METRICS.map((metric) => metric.key));
      const systems = items.find((item) => item.key === "systems_delivered")!;
      expect(systems.title).toBe("Systems delivered");
      expect(systems.placements.map((placement) => placement.page)).toEqual(["Contact", "Cleaning landing page", "Home"]);
      expect(systems.hint).toMatch(/whole number/);
    });
  });

  describe("update", () => {
    it("changes one figure, refreshes the website and shows on the public list", async () => {
      const response = await api("PATCH", "/cms/site-metrics/businesses_supported", {
        payload: { value: "60+" },
        cookie: editorCookie,
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<MetricBody>()).toMatchObject({ key: "businesses_supported", value: "60+" });
      expect(refreshes).toHaveBeenCalledTimes(1);

      const publicList = await api("GET", "/cms/public/site-metrics");
      expect(publicList.statusCode).toBe(200);
      const { values } = publicList.json<{ values: Record<string, string> }>();
      expect(values.businesses_supported).toBe("60+");
      expect(Object.keys(values).sort()).toEqual(SITE_METRICS.map((metric) => metric.key).sort());
    });

    it("leaves the other figures alone", async () => {
      const list = (await api("GET", "/cms/site-metrics", { cookie: editorCookie })).json<{ items: MetricBody[] }>().items;
      const years = list.find((item) => item.key === "years_experience")!;
      await api("PATCH", "/cms/site-metrics/projects_completed", { payload: { value: "80+" }, cookie: editorCookie });
      const after = (await api("GET", "/cms/site-metrics", { cookie: editorCookie })).json<{ items: MetricBody[] }>().items;
      expect(after.find((item) => item.key === "years_experience")!.value).toBe(years.value);
    });

    it("does not refresh the website when the value did not change", async () => {
      await api("PATCH", "/cms/site-metrics/projects_completed", { payload: { value: "81+" }, cookie: editorCookie });
      refreshes.mockClear();
      const again = await api("PATCH", "/cms/site-metrics/projects_completed", {
        payload: { value: "81+" },
        cookie: editorCookie,
      });
      expect(again.statusCode).toBe(200);
      expect(refreshes).not.toHaveBeenCalled();
    });

    it("refuses a value in the wrong format, per kind", async () => {
      for (const [key, value] of [
        ["years_experience", "4.5+"],
        ["years_experience", "lots"],
        ["google_rating", "5.1"],
        ["google_rating", "4.85"],
        ["client_retention", ""],
      ] as const) {
        const response = await api("PATCH", `/cms/site-metrics/${key}`, { payload: { value }, cookie: editorCookie });
        expect(response.statusCode).toBe(400);
      }
      expect(refreshes).not.toHaveBeenCalled();
    });

    it("answers 400 or 404 for an unknown key", async () => {
      const response = await api("PATCH", "/cms/site-metrics/not_a_metric", { payload: { value: "1" }, cookie: editorCookie });
      expect([400, 404]).toContain(response.statusCode);
    });

    it("accepts a rating and keeps the audit entry free of anything but the figures", async () => {
      const response = await api("PATCH", "/cms/site-metrics/fiverr_rating", { payload: { value: "4.9" }, cookie: editorCookie });
      expect(response.statusCode).toBe(200);
      const audit = await pool.query<{ metadata: Record<string, unknown> }>(
        `select metadata from core.audit_log where action = 'cms.site_metric.updated' and metadata->>'key' = 'fiverr_rating' order by occurred_at desc limit 1`,
      );
      const { key, to, ...rest } = audit.rows[0]!.metadata;
      expect({ key, to }).toEqual({ key: "fiverr_rating", to: "4.9" });
      expect(Object.keys(rest)).toEqual(["from"]);
    });
  });

  describe("public list", () => {
    it("needs no session and always has every key, with the default for a figure that was never saved", async () => {
      await pool.query("delete from cms.site_metrics where key = 'clutch_rating'");
      const response = await api("GET", "/cms/public/site-metrics");
      expect(response.statusCode).toBe(200);
      expect(response.json<{ values: Record<string, string> }>().values.clutch_rating).toBe("4.8");
    });
  });
});
