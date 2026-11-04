import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { users } from "../src/shared/auth/auth.schema";
import { AuditService } from "../src/shared/audit/audit.service";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";
import { StorageUnavailableError } from "../src/shared/storage/storage.errors";
import { StorageService } from "../src/shared/storage/storage.service";
import { jpeg, png, webp } from "./support/images";

// The case study endpoints against a real, migrated PostgreSQL (backend/RULES.md section 6). Storage is replaced by an in-memory
// fake of the public bucket, so nothing touches R2. It creates its own users, roles and case studies and removes them afterwards.
// Skipped unless TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://… npm test -- cms.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";
const RUN = randomUUID().slice(0, 8);

interface StudyBody {
  id: string;
  slug: string;
  title: string;
  status: string;
  sortOrder: number;
  publishedAt: string | null;
  tags: string[];
  stats: { value: string; label: string }[];
  image: { url: string; alt: string; width: number; height: number } | null;
  seoTitle: string;
}

describeWithDb("CMS case studies (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const staffEmail = `e2e-cms-staff-${RUN}@test.invalid`;
  const ownerEmail = `e2e-cms-owner-${RUN}@test.invalid`;
  const readerEmail = `e2e-cms-reader-${RUN}@test.invalid`;
  const guestEmail = `e2e-cms-guest-${RUN}@test.invalid`;
  const roleNames = [`e2e-cms-staff-${RUN}`, `e2e-cms-owner-${RUN}`, `e2e-cms-read-${RUN}`, `e2e-cms-none-${RUN}`];
  const marker = `E2E ${RUN}`;
  // Slugs are the title, so a unique run id keeps parallel runs and old leftovers from clashing.
  const slugBase = `e2e-${RUN}`;
  // The fake public bucket: key to the stored bytes, type and cache header.
  const objects = new Map<string, { body: Buffer; contentType: string; cacheControl?: string }>();
  const keysUnder = (slug: string) => [...objects.keys()].filter((key) => key.startsWith(`case-study/${slug}/`));
  let staffCookie = "";
  let ownerCookie = "";
  let readerCookie = "";
  let guestCookie = "";

  // The slug is the title, so a default title must differ between calls or the second create would clash.
  let sequence = 0;
  const study = (patch: Record<string, unknown> = {}) => ({
    title: `${marker} Royal Safari ${sequence++}`,
    summary: "A tour website.",
    client: "Royal Safari Tours",
    service: "website-infrastructure",
    category: "website-infrastructure",
    description: "A full build.",
    challenge: "Present tours clearly.",
    ...patch,
  });
  const stats = (count: number) => Array.from({ length: count }, (_, i) => ({ value: `${i + 1}`, label: `Result ${i + 1}` }));

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
  async function createDraft(patch: Record<string, unknown> = {}): Promise<StudyBody> {
    const response = await asStaff("POST", "/cms/case-studies", study(patch));
    expect(response.statusCode).toBe(201);
    return response.json<StudyBody>();
  }

  /** The image upload is Phase 2, so the tests give a study an image straight in the database. */
  async function giveImage(id: string, alt: string | null = "A tablet showing the site") {
    await pool.query(
      `update cms.case_studies set image_key = $2, image_alt = $3, image_width = 551, image_height = 525, image_size = 1000, image_type = 'image/png' where id = $1::uuid`,
      [id, `case-study/${slugBase}/image1.png`, alt],
    );
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
    await makeUser(staffEmail, roleNames[0]!, ["cms.case_study.read", "cms.case_study.create", "cms.case_study.update"]);
    await makeUser(ownerEmail, roleNames[1]!, [
      "cms.case_study.read",
      "cms.case_study.create",
      "cms.case_study.update",
      "cms.case_study.delete",
    ]);
    await makeUser(readerEmail, roleNames[2]!, ["cms.case_study.read"]);
    await makeUser(guestEmail, roleNames[3]!, ["inventory.stock.read"]);

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

    staffCookie = await signIn(staffEmail);
    ownerCookie = await signIn(ownerEmail);
    readerCookie = await signIn(readerEmail);
    guestCookie = await signIn(guestEmail);
  });

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    // Only this run's rows: the other e2e suites share the database and run in parallel.
    await pool.query(
      `delete from core.audit_log where entity_id in (select id::text from cms.case_studies where title like $1)`,
      [`${marker}%`],
    );
    await pool.query(`delete from cms.case_studies where title like $1`, [`${marker}%`]);
    await pool.query(
      `delete from core.audit_log where action like 'cms.%' and actor_id in (select id from core.users where email like $1)`,
      [`e2e-cms-%-${RUN}@test.invalid`],
    );
    await db.delete(users).where(like(users.email, `e2e-cms-%-${RUN}@test.invalid`));
    for (const name of roleNames) await db.delete(roles).where(eq(roles.name, name));
    await pool.end();
  });

  describe("access", () => {
    it("needs a session", async () => {
      expect((await api("GET", "/cms/case-studies")).statusCode).toBe(401);
      expect((await api("POST", "/cms/case-studies", { payload: study() })).statusCode).toBe(401);
      expect((await api("PUT", "/cms/case-studies/order", { payload: { ids: [randomUUID()] } })).statusCode).toBe(401);
      expect((await api("DELETE", `/cms/case-studies/${randomUUID()}`)).statusCode).toBe(401);
    });

    it("refuses an employee without the permission", async () => {
      const id = randomUUID();
      const as = (method: Method, url: string, payload?: object) => api(method, url, { payload, cookie: guestCookie });
      expect((await as("GET", "/cms/case-studies")).statusCode).toBe(403);
      expect((await as("POST", "/cms/case-studies", study())).statusCode).toBe(403);
      expect((await as("PATCH", `/cms/case-studies/${id}`, { title: "x" })).statusCode).toBe(403);
      expect((await as("POST", `/cms/case-studies/${id}/publish`)).statusCode).toBe(403);
      expect((await as("PUT", "/cms/case-studies/order", { ids: [id] })).statusCode).toBe(403);
      expect((await as("DELETE", `/cms/case-studies/${id}`)).statusCode).toBe(403);
    });

    it("lets a reader read but not change anything", async () => {
      const draft = await createDraft();
      const reader = (method: Method, url: string, payload?: object) => api(method, url, { payload, cookie: readerCookie });
      expect((await reader("GET", "/cms/case-studies")).statusCode).toBe(200);
      expect((await reader("GET", `/cms/case-studies/${draft.id}`)).statusCode).toBe(200);
      expect((await reader("POST", "/cms/case-studies", study())).statusCode).toBe(403);
      expect((await reader("PATCH", `/cms/case-studies/${draft.id}`, { title: "x" })).statusCode).toBe(403);
      expect((await reader("POST", `/cms/case-studies/${draft.id}/unpublish`)).statusCode).toBe(403);
    });

    it("keeps delete separate from update", async () => {
      const draft = await createDraft();
      expect((await asStaff("DELETE", `/cms/case-studies/${draft.id}`)).statusCode).toBe(403);
      expect((await asOwner("DELETE", `/cms/case-studies/${draft.id}`)).statusCode).toBe(204);
    });
  });

  describe("create", () => {
    it("saves a draft with a slug from the title, defaults and the next position", async () => {
      const first = await createDraft({ title: `${marker} First One` });
      const second = await createDraft({ title: `${marker} Second One` });

      expect(first).toMatchObject({
        slug: expect.stringMatching(/^e2e-[0-9a-f]{8}-first-one$/) as string,
        status: "draft",
        publishedAt: null,
        image: null,
        tags: [],
        stats: [],
        seoTitle: "",
      });
      expect(second.sortOrder).toBeGreaterThan(first.sortOrder);
    });

    it("keeps tags, results and SEO text", async () => {
      const created = await createDraft({
        title: `${marker} Full`,
        tags: ["Next.js", "Admin Dashboard"],
        stats: stats(4),
        seoTitle: "Royal Safari Tours: Travel Website Case Study",
        seoDescription: "How we built it.",
      });
      expect(created.tags).toEqual(["Next.js", "Admin Dashboard"]);
      expect(created.stats).toHaveLength(4);
      expect(created.seoTitle).toBe("Royal Safari Tours: Travel Website Case Study");
    });

    it("takes an explicit slug and refuses one that is taken", async () => {
      const slug = `${slugBase}-explicit`;
      const created = await createDraft({ title: `${marker} Different Title`, slug });
      expect(created.slug).toBe(slug);

      const again = await asStaff("POST", "/cms/case-studies", study({ title: `${marker} Another`, slug }));
      expect(again.statusCode).toBe(409);
      expect(again.json<{ details: { slug: string } }>().details).toEqual({ slug });

      // Same title as an existing one: the slug is the title, so it clashes too (no silent random suffix).
      const sameTitle = await asStaff("POST", "/cms/case-studies", study({ title: `${marker} First One` }));
      expect(sameTitle.statusCode).toBe(409);
    });

    it("rejects bad input", async () => {
      const bad = async (patch: Record<string, unknown>) => (await asStaff("POST", "/cms/case-studies", study(patch))).statusCode;
      expect(await bad({ slug: "Not Valid" })).toBe(400);
      expect(await bad({ slug: "../escape" })).toBe(400);
      expect(await bad({ service: "seo" })).toBe(400);
      expect(await bad({ category: "everything" })).toBe(400);
      expect(await bad({ stats: stats(2) })).toBe(400);
      expect(await bad({ tags: Array.from({ length: 9 }, (_, i) => `t${i}`) })).toBe(400);
      expect(await bad({ title: "   " })).toBe(400);
      expect(await bad({ summary: undefined })).toBe(400);
    });
  });

  describe("read and edit", () => {
    it("lists in display order, filters by status and searches title and client", async () => {
      const draft = await createDraft({ title: `${marker} Searchable`, client: `Zeta ${RUN} Client` });
      const byClient = await asStaff("GET", `/cms/case-studies?q=${encodeURIComponent(`Zeta ${RUN}`)}`);
      expect(byClient.statusCode).toBe(200);
      expect(byClient.json<{ items: StudyBody[]; total: number }>().items.map((item) => item.id)).toEqual([draft.id]);

      const byTitle = await asStaff("GET", `/cms/case-studies?q=${encodeURIComponent(`${marker} Searchable`)}`);
      expect(byTitle.json<{ total: number }>().total).toBe(1);

      // `%` is matched literally, not as a wildcard
      const wildcard = await asStaff("GET", `/cms/case-studies?q=${encodeURIComponent(`${marker}%`)}`);
      expect(wildcard.json<{ total: number }>().total).toBe(0);

      const published = await asStaff("GET", "/cms/case-studies?status=published&pageSize=100");
      expect(published.json<{ items: StudyBody[] }>().items.every((item) => item.status === "published")).toBe(true);

      const ordered = (await asStaff("GET", "/cms/case-studies?pageSize=100")).json<{ items: StudyBody[] }>().items;
      const orders = ordered.map((item) => item.sortOrder);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });

    it("pages and caps the page size", async () => {
      const page = await asStaff("GET", "/cms/case-studies?page=1&pageSize=1");
      expect(page.json<{ items: unknown[]; pageSize: number }>()).toMatchObject({ pageSize: 1 });
      expect(page.json<{ items: unknown[] }>().items.length).toBeLessThanOrEqual(1);
      expect((await asStaff("GET", "/cms/case-studies?pageSize=101")).statusCode).toBe(400);
    });

    it("returns one study, and 404 for an unknown or malformed id", async () => {
      const draft = await createDraft({ title: `${marker} Single` });
      const found = await asStaff("GET", `/cms/case-studies/${draft.id}`);
      expect(found.statusCode).toBe(200);
      expect(found.json<StudyBody>().id).toBe(draft.id);
      expect((await asStaff("GET", `/cms/case-studies/${randomUUID()}`)).statusCode).toBe(404);
      expect((await asStaff("GET", "/cms/case-studies/not-a-uuid")).statusCode).toBe(400);
    });

    it("edits some fields and leaves the rest, and never changes the slug", async () => {
      const draft = await createDraft({ title: `${marker} Editable`, tags: ["Old"] });
      const edited = await asStaff("PATCH", `/cms/case-studies/${draft.id}`, {
        client: "New Client",
        tags: ["New", "Tags"],
        stats: stats(4),
        service: "ad-tech",
      });
      expect(edited.statusCode).toBe(200);
      expect(edited.json<StudyBody & { client: string; service: string; summary: string }>()).toMatchObject({
        slug: draft.slug,
        title: `${marker} Editable`,
        client: "New Client",
        service: "ad-tech",
        tags: ["New", "Tags"],
        summary: "A tour website.",
      });

      // Results can be cleared again, but not partly filled
      expect((await asStaff("PATCH", `/cms/case-studies/${draft.id}`, { stats: [] })).statusCode).toBe(200);
      expect((await asStaff("PATCH", `/cms/case-studies/${draft.id}`, { stats: stats(3) })).statusCode).toBe(400);
    });

    it("refuses an empty change, a slug change and an unknown study", async () => {
      const draft = await createDraft({ title: `${marker} Strict` });
      expect((await asStaff("PATCH", `/cms/case-studies/${draft.id}`, {})).statusCode).toBe(400);
      expect((await asStaff("PATCH", `/cms/case-studies/${draft.id}`, { slug: "other-slug" })).statusCode).toBe(400);
      expect((await asStaff("PATCH", `/cms/case-studies/${randomUUID()}`, { title: "x" })).statusCode).toBe(404);
    });
  });

  describe("publish and unpublish", () => {
    it("will not publish without an image, or without its alt text", async () => {
      const draft = await createDraft({ title: `${marker} Needs Image` });
      const noImage = await asStaff("POST", `/cms/case-studies/${draft.id}/publish`);
      expect(noImage.statusCode).toBe(400);
      expect(noImage.json<{ message: string }>().message).toMatch(/image/i);

      await giveImage(draft.id, null);
      const noAlt = await asStaff("POST", `/cms/case-studies/${draft.id}/publish`);
      expect(noAlt.statusCode).toBe(400);
      expect(noAlt.json<{ message: string }>().message).toMatch(/alt/i);
      expect((await asStaff("GET", `/cms/case-studies/${draft.id}`)).json<StudyBody>().status).toBe("draft");
    });

    it("publishes, shows the image URL, and refuses a second publish", async () => {
      const draft = await createDraft({ title: `${marker} Goes Live` });
      await giveImage(draft.id);

      const published = await asStaff("POST", `/cms/case-studies/${draft.id}/publish`);
      expect(published.statusCode).toBe(200);
      const body = published.json<StudyBody>();
      expect(body.status).toBe("published");
      expect(body.publishedAt).not.toBeNull();
      // The public address, never the bucket key on its own
      expect(body.image).toEqual({
        url: `https://public.test/case-study/${slugBase}/image1.png`,
        alt: "A tablet showing the site",
        width: 551,
        height: 525,
      });

      expect((await asStaff("POST", `/cms/case-studies/${draft.id}/publish`)).statusCode).toBe(409);
    });

    it("unpublishes back to a draft and keeps the first publish date when it goes live again", async () => {
      const draft = await createDraft({ title: `${marker} Round Trip` });
      await giveImage(draft.id);
      const first = (await asStaff("POST", `/cms/case-studies/${draft.id}/publish`)).json<StudyBody>();

      const unpublished = await asStaff("POST", `/cms/case-studies/${draft.id}/unpublish`);
      expect(unpublished.statusCode).toBe(200);
      expect(unpublished.json<StudyBody>().status).toBe("draft");
      expect((await asStaff("POST", `/cms/case-studies/${draft.id}/unpublish`)).statusCode).toBe(409);

      const again = (await asStaff("POST", `/cms/case-studies/${draft.id}/publish`)).json<StudyBody>();
      expect(again.publishedAt).toBe(first.publishedAt);
    });

    it("404s for an unknown study", async () => {
      expect((await asStaff("POST", `/cms/case-studies/${randomUUID()}/publish`)).statusCode).toBe(404);
      expect((await asStaff("POST", `/cms/case-studies/${randomUUID()}/unpublish`)).statusCode).toBe(404);
    });

    it("is backed by the database: a published row cannot lack its image", async () => {
      const draft = await createDraft({ title: `${marker} Constraint` });
      await expect(
        pool.query(`update cms.case_studies set status = 'published' where id = $1::uuid`, [draft.id]),
      ).rejects.toThrow(/case_studies_published_image_check/);
    });
  });

  describe("order", () => {
    it("sets the order from the full list and returns it", async () => {
      const a = await createDraft({ title: `${marker} Order A` });
      const b = await createDraft({ title: `${marker} Order B` });
      const c = await createDraft({ title: `${marker} Order C` });
      const ours = [a.id, b.id, c.id];

      const all = (await asStaff("GET", "/cms/case-studies?pageSize=100"))
        .json<{ items: StudyBody[] }>()
        .items.map((item) => item.id);
      // Keep every other study where it is and only reverse our three, so shared data keeps its relative order.
      const reversed = [...ours].reverse();
      let next = 0;
      const wanted = all.map((id) => (ours.includes(id) ? reversed[next++]! : id));

      const response = await asStaff("PUT", "/cms/case-studies/order", { ids: wanted });
      expect(response.statusCode).toBe(200);
      const items = response.json<{ items: StudyBody[] }>().items;
      expect(items.map((item) => item.id)).toEqual(wanted);
      expect(items.map((item) => item.sortOrder)).toEqual(wanted.map((_, position) => position));
    });

    it("refuses a list that is missing a study, repeats one, or names an unknown one", async () => {
      const all = (await asStaff("GET", "/cms/case-studies?pageSize=100"))
        .json<{ items: StudyBody[] }>()
        .items.map((item) => item.id);
      const send = async (ids: string[]) => (await asStaff("PUT", "/cms/case-studies/order", { ids })).statusCode;

      expect(await send(all.slice(1))).toBe(400);
      expect(await send([...all, all[0]!])).toBe(400);
      expect(await send([...all.slice(1), randomUUID()])).toBe(400);
      expect(await send([])).toBe(400);
    });
  });

  describe("delete", () => {
    it("deletes a draft for good", async () => {
      const draft = await createDraft({ title: `${marker} Remove Me` });
      expect((await asOwner("DELETE", `/cms/case-studies/${draft.id}`)).statusCode).toBe(204);
      expect((await asOwner("GET", `/cms/case-studies/${draft.id}`)).statusCode).toBe(404);
      expect((await asOwner("DELETE", `/cms/case-studies/${draft.id}`)).statusCode).toBe(404);
    });

    it("refuses to delete a published study until it is unpublished", async () => {
      const draft = await createDraft({ title: `${marker} Live One` });
      await giveImage(draft.id);
      await asStaff("POST", `/cms/case-studies/${draft.id}/publish`);

      const refused = await asOwner("DELETE", `/cms/case-studies/${draft.id}`);
      expect(refused.statusCode).toBe(409);
      expect((await asOwner("GET", `/cms/case-studies/${draft.id}`)).statusCode).toBe(200);

      await asStaff("POST", `/cms/case-studies/${draft.id}/unpublish`);
      expect((await asOwner("DELETE", `/cms/case-studies/${draft.id}`)).statusCode).toBe(204);
    });
  });

  // Helpers for every describe below that uploads an image.
  interface UploadOptions {
    alt?: string | null;
    cookie?: string;
    field?: string;
    filename?: string;
    type?: string;
  }
  /** Builds the admin's multipart request: an `alt` field and one file (or none). */
  function multipart(fields: Record<string, string>, files: { field: string; filename: string; type: string; body: Buffer }[]) {
    const boundary = `----e2e${randomUUID()}`;
    const chunks: Buffer[] = [];
    for (const [name, value] of Object.entries(fields)) {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
    }
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
    const fields: Record<string, string> = options.alt === null ? {} : { alt: options.alt ?? "A tablet showing the site" };
    const files = file
      ? [
          {
            field: options.field ?? "image",
            filename: options.filename ?? "showcase.png",
            type: options.type ?? "image/png",
            body: file,
          },
        ]
      : [];
    const form = multipart(fields, files);
    return app.inject({
      method: "PUT",
      url: `/api/v1/cms/case-studies/${id}/image`,
      payload: form.body,
      headers: { "content-type": form.contentType, cookie: options.cookie ?? staffCookie },
    });
  };
  const imageRow = async (id: string) => {
    const { rows } = await pool.query<{
      image_key: string | null;
      image_alt: string | null;
      image_size: number | null;
      image_type: string | null;
    }>(`select image_key, image_alt, image_size, image_type from cms.case_studies where id = $1::uuid`, [id]);
    return rows[0]!;
  };

  describe("image", () => {
    it("stores the first image as image1 in the study's folder, with its real type, a long cache header and its size", async () => {
      const draft = await createDraft({ title: `${marker} Img First` });
      const file = png(551, 525, 300);
      const response = await upload(draft.id, file);

      expect(response.statusCode).toBe(200);
      expect(response.json<StudyBody>().image).toEqual({
        url: `https://public.test/case-study/${draft.slug}/image1.png`,
        alt: "A tablet showing the site",
        width: 551,
        height: 525,
      });
      expect(objects.get(`case-study/${draft.slug}/image1.png`)).toMatchObject({
        contentType: "image/png",
        cacheControl: "public, max-age=31536000, immutable",
      });
      expect(await imageRow(draft.id)).toMatchObject({
        image_key: `case-study/${draft.slug}/image1.png`,
        image_size: file.length,
        image_type: "image/png",
      });
    });

    it("replaces the image with the next number and the new extension, and never reuses a number", async () => {
      const draft = await createDraft({ title: `${marker} Img Replace` });
      await upload(draft.id, png(551, 525));
      expect(keysUnder(draft.slug)).toEqual([`case-study/${draft.slug}/image1.png`]);

      const second = await upload(draft.id, jpeg(1102, 1050), { alt: "A new picture" });
      expect(second.statusCode).toBe(200);
      expect(second.json<StudyBody>().image).toMatchObject({
        url: `https://public.test/case-study/${draft.slug}/image2.jpg`,
        alt: "A new picture",
        width: 1102,
        height: 1050,
      });
      // The old file is gone and nothing else is left
      expect(keysUnder(draft.slug)).toEqual([`case-study/${draft.slug}/image2.jpg`]);

      // image1 is free again, but it must not come back: a cache may still hold the old picture at that address
      await upload(draft.id, webp(800, 600));
      expect(keysUnder(draft.slug)).toEqual([`case-study/${draft.slug}/image3.webp`]);
      expect((await imageRow(draft.id)).image_type).toBe("image/webp");
    });

    it("skips numbers already taken by files left over from a failed cleanup", async () => {
      const draft = await createDraft({ title: `${marker} Img Orphan` });
      objects.set(`case-study/${draft.slug}/image7.png`, { body: Buffer.from("old"), contentType: "image/png" });

      await upload(draft.id, png(551, 525));
      expect((await imageRow(draft.id)).image_key).toBe(`case-study/${draft.slug}/image8.png`);
    });

    it("trusts the file's own bytes, not its name or the type the client claimed", async () => {
      const draft = await createDraft({ title: `${marker} Img Honest` });
      const fake = await upload(draft.id, Buffer.from("this is only text, whatever it is called"), {
        filename: "x.png",
        type: "image/png",
      });
      expect(fake.statusCode).toBe(400);
      expect(fake.json<{ message: string }>().message).toMatch(/PNG, JPEG or WebP/);
      const pdf = await upload(draft.id, Buffer.from("%PDF-1.7 a document, not a picture"), {
        filename: "x.png",
        type: "image/png",
      });
      expect(pdf.statusCode).toBe(400);
      expect(keysUnder(draft.slug)).toEqual([]);

      // A real PNG with a misleading name is accepted for what it is
      const real = await upload(draft.id, png(551, 525), { filename: "showcase.pdf", type: "application/pdf" });
      expect(real.statusCode).toBe(200);
      expect(real.json<StudyBody>().image?.url).toMatch(/image1\.png$/);
    });

    it("refuses an empty file and a file over 5 MB, and stores nothing", async () => {
      const draft = await createDraft({ title: `${marker} Img Size` });
      expect((await upload(draft.id, Buffer.alloc(0))).statusCode).toBe(400);

      const tooBig = await upload(draft.id, png(551, 525, 6 * 1024 * 1024));
      expect(tooBig.statusCode).toBe(400);
      expect(tooBig.json<{ message: string }>().message).toMatch(/5 MB/);
      expect(keysUnder(draft.slug)).toEqual([]);
      expect((await imageRow(draft.id)).image_key).toBeNull();
    });

    it("needs alt text, trims it and limits its length", async () => {
      const draft = await createDraft({ title: `${marker} Img Alt` });
      expect((await upload(draft.id, png(551, 525), { alt: null })).statusCode).toBe(400);
      expect((await upload(draft.id, png(551, 525), { alt: "   " })).statusCode).toBe(400);
      expect((await upload(draft.id, png(551, 525), { alt: "x".repeat(201) })).statusCode).toBe(400);
      expect(keysUnder(draft.slug)).toEqual([]);

      const ok = await upload(draft.id, png(551, 525), { alt: "  Padded description  " });
      expect(ok.json<StudyBody>().image?.alt).toBe("Padded description");
    });

    it("rejects a request that is not a single `image` file in a multipart form", async () => {
      const draft = await createDraft({ title: `${marker} Img Form` });
      const json = await app.inject({
        method: "PUT",
        url: `/api/v1/cms/case-studies/${draft.id}/image`,
        payload: { alt: "x" },
        headers: { cookie: staffCookie },
      });
      expect(json.statusCode).toBe(400);
      expect((await upload(draft.id, null)).statusCode).toBe(400);
      expect((await upload(draft.id, png(551, 525), { field: "photo" })).statusCode).toBe(400);

      const two = multipart({ alt: "x" }, [
        { field: "image", filename: "a.png", type: "image/png", body: png(10, 10) },
        { field: "image", filename: "b.png", type: "image/png", body: png(10, 10) },
      ]);
      const response = await app.inject({
        method: "PUT",
        url: `/api/v1/cms/case-studies/${draft.id}/image`,
        payload: two.body,
        headers: { "content-type": two.contentType, cookie: staffCookie },
      });
      expect(response.statusCode).toBe(400);
      expect(keysUnder(draft.slug)).toEqual([]);
    });

    it("needs a session and the update permission, and 404s for an unknown study without storing anything", async () => {
      const draft = await createDraft({ title: `${marker} Img Access` });
      const before = objects.size;
      const anonymous = await app.inject({
        method: "PUT",
        url: `/api/v1/cms/case-studies/${draft.id}/image`,
        payload: multipart({ alt: "x" }, []).body,
        headers: { "content-type": "multipart/form-data; boundary=x" },
      });
      expect(anonymous.statusCode).toBe(401);
      expect((await upload(draft.id, png(551, 525), { cookie: readerCookie })).statusCode).toBe(403);
      expect((await upload(draft.id, png(551, 525), { cookie: guestCookie })).statusCode).toBe(403);
      expect((await upload(randomUUID(), png(551, 525))).statusCode).toBe(404);
      expect(objects.size).toBe(before);
    });

    it("keeps a published study published when its image is replaced, and edits the alt text on its own", async () => {
      const draft = await createDraft({ title: `${marker} Img Live` });
      expect((await asStaff("PATCH", `/cms/case-studies/${draft.id}`, { imageAlt: "Too early" })).statusCode).toBe(400);

      await upload(draft.id, png(551, 525));
      expect((await asStaff("POST", `/cms/case-studies/${draft.id}/publish`)).statusCode).toBe(200);
      const replaced = await upload(draft.id, jpeg(551, 525), { alt: "Second picture" });
      expect(replaced.json<StudyBody>().status).toBe("published");

      const edited = await asStaff("PATCH", `/cms/case-studies/${draft.id}`, { imageAlt: "Reworded" });
      expect(edited.statusCode).toBe(200);
      expect(edited.json<StudyBody>().image).toMatchObject({ alt: "Reworded", width: 551 });
      expect((await asStaff("PATCH", `/cms/case-studies/${draft.id}`, { imageAlt: "   " })).statusCode).toBe(400);
    });

    it("stores nothing and leaves the study as it was when storage is down", async () => {
      const draft = await createDraft({ title: `${marker} Img Down` });
      jest.spyOn(app.get(StorageService), "putPublicIfAbsent").mockRejectedValueOnce(new StorageUnavailableError());

      const response = await upload(draft.id, png(551, 525));
      expect(response.statusCode).toBe(503);
      expect(keysUnder(draft.slug)).toEqual([]);
      expect((await asStaff("GET", `/cms/case-studies/${draft.id}`)).json<StudyBody>().image).toBeNull();
    });

    it("removes the new file again when the database update fails", async () => {
      const draft = await createDraft({ title: `${marker} Img Rollback` });
      await upload(draft.id, png(551, 525));
      const before = await imageRow(draft.id);
      jest.spyOn(app.get(AuditService), "record").mockRejectedValueOnce(new Error("database went away"));

      const response = await upload(draft.id, jpeg(551, 525));
      expect(response.statusCode).toBe(500);
      // The study still points at its first image, which is still there, and no extra file was left behind
      expect(await imageRow(draft.id)).toEqual(before);
      expect(keysUnder(draft.slug)).toEqual([`case-study/${draft.slug}/image1.png`]);
    });

    it("still succeeds when the replaced file cannot be deleted, leaving it as an orphan that later uploads skip", async () => {
      const draft = await createDraft({ title: `${marker} Img Stuck` });
      await upload(draft.id, png(551, 525));
      jest.spyOn(app.get(StorageService), "deletePublic").mockRejectedValueOnce(new StorageUnavailableError());

      const response = await upload(draft.id, jpeg(551, 525));
      expect(response.statusCode).toBe(200);
      expect(response.json<StudyBody>().image?.url).toMatch(/image2\.jpg$/);
      expect(keysUnder(draft.slug).sort()).toEqual([
        `case-study/${draft.slug}/image1.png`,
        `case-study/${draft.slug}/image2.jpg`,
      ]);

      await upload(draft.id, webp(800, 600));
      expect((await imageRow(draft.id)).image_key).toBe(`case-study/${draft.slug}/image3.webp`);
    });

    it("ends with exactly one file, the one the study points at, when two uploads arrive together", async () => {
      const draft = await createDraft({ title: `${marker} Img Race` });
      const [a, b] = await Promise.all([upload(draft.id, png(551, 525)), upload(draft.id, jpeg(551, 525))]);
      expect([a.statusCode, b.statusCode]).toEqual([200, 200]);

      const keys = keysUnder(draft.slug);
      expect(keys).toHaveLength(1);
      expect((await imageRow(draft.id)).image_key).toBe(keys[0]);
    });

    it("writes an audit entry with the type and size, never the file name, alt text or key", async () => {
      const draft = await createDraft({ title: `${marker} Img Audit` });
      await upload(draft.id, png(551, 525), { alt: `Secret alt ${RUN}`, filename: `private-name-${RUN}.png` });
      await upload(draft.id, jpeg(551, 525));

      const { rows } = await pool.query<{ action: string; metadata: Record<string, unknown> }>(
        `select action, metadata from core.audit_log where entity_id = $1 and action = 'cms.case_study.image_replaced' order by occurred_at, id`,
        [draft.id],
      );
      expect(rows.map((row) => row.metadata)).toEqual([
        { replaced: false, type: "image/png", size: png(551, 525).length },
        { replaced: true, type: "image/jpeg", size: jpeg(551, 525).length },
      ]);
      expect(JSON.stringify(rows)).not.toContain(RUN);
    });
  });

  describe("deleting a study's files", () => {
    it("removes the whole image folder with the study, and only that study's", async () => {
      const gone = await createDraft({ title: `${marker} Del Files` });
      const kept = await createDraft({ title: `${marker} Del Keep` });
      await upload(gone.id, png(551, 525));
      await upload(kept.id, png(551, 525));
      objects.set(`case-study/${gone.slug}/image9.png`, { body: Buffer.from("orphan"), contentType: "image/png" });

      expect((await asOwner("DELETE", `/cms/case-studies/${gone.id}`)).statusCode).toBe(204);
      expect(keysUnder(gone.slug)).toEqual([]);
      expect(keysUnder(kept.slug)).toHaveLength(1);
    });

    it("refuses to delete a published study and keeps its files", async () => {
      const live = await createDraft({ title: `${marker} Del Live` });
      await upload(live.id, png(551, 525));
      await asStaff("POST", `/cms/case-studies/${live.id}/publish`);

      expect((await asOwner("DELETE", `/cms/case-studies/${live.id}`)).statusCode).toBe(409);
      expect(keysUnder(live.slug)).toHaveLength(1);
    });

    it("still deletes the study when its files cannot be removed (they become an orphan folder)", async () => {
      const draft = await createDraft({ title: `${marker} Del Stuck` });
      await upload(draft.id, png(551, 525));
      jest.spyOn(app.get(StorageService), "deletePublicPrefix").mockRejectedValueOnce(new StorageUnavailableError());

      expect((await asOwner("DELETE", `/cms/case-studies/${draft.id}`)).statusCode).toBe(204);
      expect((await asOwner("GET", `/cms/case-studies/${draft.id}`)).statusCode).toBe(404);
      expect(keysUnder(draft.slug)).toHaveLength(1);
    });
  });

  describe("public endpoints", () => {
    const publicApi = (url: string) => app.inject({ method: "GET", url: `/api/v1/cms/public/case-studies${url}` });
    interface PublicItem {
      slug: string;
      title: string;
      image: { url: string; alt: string; width: number; height: number };
      [key: string]: unknown;
    }

    async function publishedStudy(title: string, patch: Record<string, unknown> = {}) {
      const draft = await createDraft({ title, ...patch });
      await upload(draft.id, png(551, 525));
      expect((await asStaff("POST", `/cms/case-studies/${draft.id}/publish`)).statusCode).toBe(200);
      return draft;
    }

    it("needs no session, lists only published studies in display order, and hides drafts", async () => {
      const first = await publishedStudy(`${marker} Pub First`);
      const draft = await createDraft({ title: `${marker} Pub Draft` });
      const second = await publishedStudy(`${marker} Pub Second`);

      const response = await publicApi("");
      expect(response.statusCode).toBe(200);
      const slugs = response.json<{ items: PublicItem[] }>().items.map((item) => item.slug);
      expect(slugs).toContain(first.slug);
      expect(slugs).toContain(second.slug);
      expect(slugs).not.toContain(draft.slug);
      expect(slugs.indexOf(first.slug)).toBeLessThan(slugs.indexOf(second.slug));
    });

    it("returns only the allow-listed fields: no id, status, audit columns or bucket key", async () => {
      const study = await publishedStudy(`${marker} Pub Shape`, {
        tags: ["Next.js"],
        stats: [1, 2, 3, 4].map((n) => ({ value: `${n}`, label: `Result ${n}` })),
        seoTitle: "Meta title",
      });

      const one = await publicApi(`/${study.slug}`);
      expect(one.statusCode).toBe(200);
      const body = one.json<PublicItem>();
      expect(Object.keys(body).sort()).toEqual(
        [
          "category",
          "challenge",
          "client",
          "description",
          "image",
          "publishedAt",
          "seoDescription",
          "seoTitle",
          "service",
          "slug",
          "stats",
          "summary",
          "tags",
          "title",
        ].sort(),
      );
      expect(Object.keys(body.image).sort()).toEqual(["alt", "height", "url", "width"]);
      expect(body).toMatchObject({ tags: ["Next.js"], seoTitle: "Meta title", image: { width: 551, height: 525 } });

      const inList = (await publicApi("")).json<{ items: PublicItem[] }>().items.find((item) => item.slug === study.slug);
      expect(Object.keys(inList ?? {}).sort()).toEqual(Object.keys(body).sort());
      expect(JSON.stringify(one.body)).not.toContain(study.id);
      // The image is a full address on the public base URL, never a bare bucket key
      expect(body.image.url).toBe(`https://public.test/case-study/${study.slug}/image1.png`);
    });

    it("404s for a draft, an unknown slug, and a study that was unpublished; 400 for a malformed slug", async () => {
      const draft = await createDraft({ title: `${marker} Pub Hidden` });
      expect((await publicApi(`/${draft.slug}`)).statusCode).toBe(404);
      expect((await publicApi(`/${slugBase}-does-not-exist`)).statusCode).toBe(404);
      expect((await publicApi("/Not%20A%20Slug")).statusCode).toBe(400);

      const live = await publishedStudy(`${marker} Pub Retired`);
      expect((await publicApi(`/${live.slug}`)).statusCode).toBe(200);
      await asStaff("POST", `/cms/case-studies/${live.id}/unpublish`);
      expect((await publicApi(`/${live.slug}`)).statusCode).toBe(404);
      const slugs = (await publicApi("")).json<{ items: PublicItem[] }>().items.map((item) => item.slug);
      expect(slugs).not.toContain(live.slug);
    });

    it("follows an edit and a replaced image straight away", async () => {
      const study = await publishedStudy(`${marker} Pub Fresh`);
      await asStaff("PATCH", `/cms/case-studies/${study.id}`, { summary: "A fresh summary" });
      await upload(study.id, jpeg(1102, 1050), { alt: "Fresh picture" });

      const body = (await publicApi(`/${study.slug}`)).json<PublicItem>();
      expect(body).toMatchObject({ summary: "A fresh summary", image: { alt: "Fresh picture", width: 1102 } });
      expect(body.image.url).toMatch(/image2\.jpg$/);
    });
  });

  describe("audit", () => {
    it("records what happened with the study id and field names, never the text", async () => {
      const secretText = `Confidential ${RUN} description`;
      const draft = await createDraft({ title: `${marker} Audited`, description: secretText });
      await asStaff("PATCH", `/cms/case-studies/${draft.id}`, { client: `Hidden ${RUN} Client`, tags: ["x"] });
      await giveImage(draft.id);
      await asStaff("POST", `/cms/case-studies/${draft.id}/publish`);
      await asStaff("POST", `/cms/case-studies/${draft.id}/unpublish`);
      await asOwner("DELETE", `/cms/case-studies/${draft.id}`);

      const { rows } = await pool.query<{ action: string; metadata: Record<string, unknown> | null }>(
        `select action, metadata from core.audit_log where entity_id = $1 order by occurred_at, id`,
        [draft.id],
      );
      expect(rows.map((row) => row.action)).toEqual([
        "cms.case_study.created",
        "cms.case_study.updated",
        "cms.case_study.published",
        "cms.case_study.unpublished",
        "cms.case_study.deleted",
      ]);
      expect(rows[1]!.metadata).toEqual({ fields: ["client", "tags"] });

      const everything = JSON.stringify(rows);
      expect(everything).not.toContain(secretText);
      expect(everything).not.toContain(`Hidden ${RUN} Client`);
      expect(everything).not.toContain(marker);
    });
  });
});
