import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { addDays, dhakaToday } from "../src/modules/hr/domain/employment-period";
import { AuditService } from "../src/shared/audit/audit.service";
import { users } from "../src/shared/auth/auth.schema";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";
import { StorageUnavailableError } from "../src/shared/storage/storage.errors";
import { StorageService } from "../src/shared/storage/storage.service";

// Employee documents against a real, migrated PostgreSQL with an in-memory fake bucket, so nothing touches R2
// (backend/RULES.md section 6). It creates its own users, roles and employees and removes them afterwards. Skipped unless
// TEST_DATABASE_URL is set:  TEST_DATABASE_URL=postgres://… npm test -- hr-documents.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";
const RUN = randomUUID().slice(0, 8);
const NID_PREFIX = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

interface UploadedFile {
  field: string;
  filename: string;
  type: string;
  content: Buffer;
}

function multipart(fields: Record<string, string>, files: UploadedFile[]) {
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
      file.content,
      Buffer.from("\r\n"),
    );
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

const pdfBytes = (extra = "") => Buffer.from(`%PDF-1.7\n${extra}\n%%EOF`);
const pngBytes = () =>
  Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("fake png body")]);
const file = (patch: Partial<UploadedFile> = {}): UploadedFile => ({
  field: "file",
  filename: "nid-front.pdf",
  type: "application/pdf",
  content: pdfBytes("a scanned ID"),
  ...patch,
});

interface EmployeeBody {
  id: string;
  employeeId: string;
  fullName: string;
}

interface DocumentBody {
  id: string;
  docType: string;
  title: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  expiresOn: string | null;
  note: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

describeWithDb("HR employee documents (real PostgreSQL, fake storage)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const emails = {
    admin: `e2e-hrdoc-admin-${RUN}@test.invalid`,
    viewer: `e2e-hrdoc-viewer-${RUN}@test.invalid`,
    editor: `e2e-hrdoc-editor-${RUN}@test.invalid`,
    hronly: `e2e-hrdoc-hronly-${RUN}@test.invalid`,
  };
  const roleNames = [`e2e-hrdoc-admin-${RUN}`, `e2e-hrdoc-view-${RUN}`, `e2e-hrdoc-edit-${RUN}`, `e2e-hrdoc-hr-${RUN}`];
  const marker = `E2E ${RUN}`;
  const cookies = { admin: "", viewer: "", editor: "", hronly: "" };
  let adminId = "";

  // The fake bucket: object key -> bytes.
  const objects = new Map<string, { body: Buffer; contentType: string }>();
  let putSpy: jest.SpyInstance;
  let deleteSpy: jest.SpyInstance;

  let sequence = 0;
  type Who = keyof typeof cookies | "none";
  type Method = "GET" | "POST" | "PATCH" | "DELETE";
  const api = (who: Who, method: Method, url: string, payload?: object | Buffer, contentType?: string) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      payload,
      headers: { ...(who === "none" ? {} : { cookie: cookies[who] }), ...(contentType ? { "content-type": contentType } : {}) },
    });

  async function hire(fullName = `${marker} Person ${sequence}`): Promise<EmployeeBody> {
    const n = sequence++;
    const response = await api("admin", "POST", "/hr/employees", {
      fullName,
      email: `e2e-hrdoc-${RUN}-${n}@test.invalid`,
      phone: "+880 1712-345678",
      address: "House 1, Road 2, Dhaka",
      nid: `${NID_PREFIX}${String(n).padStart(7, "0")}`,
      joinedOn: addDays(dhakaToday(), -100),
      designation: "Marketing Intern",
      employmentType: "internship",
      workMode: "onsite",
    });
    expect(response.statusCode).toBe(201);
    return response.json<EmployeeBody>();
  }

  async function upload(
    employeeId: string,
    fields: Record<string, string> = { docType: "nid" },
    files: UploadedFile[] = [file()],
    who: Who = "admin",
  ) {
    const form = multipart(fields, files);
    return api(who, "POST", `/hr/employees/${employeeId}/documents`, form.body, form.contentType);
  }

  async function uploaded(employeeId: string, fields: Record<string, string> = { docType: "nid" }, files?: UploadedFile[]) {
    const response = await upload(employeeId, fields, files);
    expect(response.statusCode).toBe(201);
    return response.json<DocumentBody>();
  }

  /** The object key a document was stored under, from the database (the API never returns it). */
  async function keyOf(documentId: string): Promise<string> {
    const result = await pool.query<{ storage_key: string }>(`select storage_key from hr.employee_documents where id = $1`, [
      documentId,
    ]);
    return result.rows[0]!.storage_key;
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
      await db.insert(rolePermissions).values(permissions.map((permission) => ({ roleId: role!.id, permission })));
      await db.insert(userRoles).values({ userId: user!.id, roleId: role!.id });
      return user!.id;
    };
    adminId = await makeUser(emails.admin, roleNames[0]!, [
      "hr.employee.read",
      "hr.employee.create",
      "hr.employee.update",
      "hr.employee.delete",
      "hr.sensitive.read",
      "hr.document.read",
      "hr.document.manage",
    ]);
    await makeUser(emails.viewer, roleNames[1]!, ["hr.document.read"]);
    await makeUser(emails.editor, roleNames[2]!, ["hr.document.manage"]);
    // HR staff who may see and edit people but have no say over their documents.
    await makeUser(emails.hronly, roleNames[3]!, ["hr.employee.read", "hr.employee.update", "hr.sensitive.read"]);

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const storage = app.get(StorageService);
    // Like R2's conditional upload: a key that is already taken is refused, never overwritten.
    putSpy = jest.spyOn(storage, "putIfAbsent").mockImplementation((key, body, contentType) => {
      if (objects.has(key)) return Promise.resolve(false);
      objects.set(key, { body, contentType });
      return Promise.resolve(true);
    });
    deleteSpy = jest.spyOn(storage, "delete").mockImplementation((key) => {
      objects.delete(key);
      return Promise.resolve();
    });
    jest.spyOn(storage, "head").mockImplementation((key) => {
      const object = objects.get(key);
      return Promise.resolve(object ? { size: object.body.length, contentType: object.contentType } : null);
    });

    for (const who of Object.keys(cookies) as (keyof typeof cookies)[]) cookies[who] = await signIn(emails[who]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // restoreAllMocks also removed the fake bucket spies; put them back for the next test.
    const storage = app.get(StorageService);
    putSpy = jest.spyOn(storage, "putIfAbsent").mockImplementation((key, body, contentType) => {
      if (objects.has(key)) return Promise.resolve(false);
      objects.set(key, { body, contentType });
      return Promise.resolve(true);
    });
    deleteSpy = jest.spyOn(storage, "delete").mockImplementation((key) => {
      objects.delete(key);
      return Promise.resolve();
    });
    jest.spyOn(storage, "head").mockImplementation((key) => {
      const object = objects.get(key);
      return Promise.resolve(object ? { size: object.body.length, contentType: object.contentType } : null);
    });
  });

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    await pool.query(
      `delete from hr.employment_records where employee_id in (select id from hr.employees where full_name like $1)`,
      [`${marker}%`],
    );
    await pool.query(`delete from hr.employees where full_name like $1`, [`${marker}%`]);
    await pool.query(
      `delete from core.audit_log where action like 'hr.%' and actor_id in (select id from core.users where email like $1)`,
      [`e2e-hrdoc-%-${RUN}@test.invalid`],
    );
    await db.delete(users).where(like(users.email, `e2e-hrdoc-%-${RUN}@test.invalid`));
    for (const name of roleNames) await db.delete(roles).where(eq(roles.name, name));
    await pool.end();
  });

  describe("access", () => {
    it("needs a session", async () => {
      const id = randomUUID();
      expect((await api("none", "GET", `/hr/employees/${id}/documents`)).statusCode).toBe(401);
      expect((await api("none", "GET", `/hr/employees/${id}/documents/${id}/link`)).statusCode).toBe(401);
      expect((await api("none", "PATCH", `/hr/employees/${id}/documents/${id}`, { title: "x" })).statusCode).toBe(401);
      expect((await api("none", "DELETE", `/hr/employees/${id}/documents/${id}`)).statusCode).toBe(401);
      expect((await upload(id, { docType: "nid" }, [file()], "none")).statusCode).toBe(401);
    });

    it("keeps documents behind their own permissions, apart from seeing and editing people", async () => {
      const employee = await hire();
      const doc = await uploaded(employee.id);
      const id = employee.id;

      // HR staff with employee and sensitive permissions still have no access to the files.
      expect((await api("hronly", "GET", `/hr/employees/${id}/documents`)).statusCode).toBe(403);
      expect((await api("hronly", "GET", `/hr/employees/${id}/documents/${doc.id}/link`)).statusCode).toBe(403);
      expect((await upload(id, { docType: "nid" }, [file()], "hronly")).statusCode).toBe(403);
      expect((await api("hronly", "DELETE", `/hr/employees/${id}/documents/${doc.id}`)).statusCode).toBe(403);

      // A viewer can read and open files but not change anything.
      expect((await api("viewer", "GET", `/hr/employees/${id}/documents`)).statusCode).toBe(200);
      expect((await api("viewer", "GET", `/hr/employees/${id}/documents/${doc.id}/link`)).statusCode).toBe(200);
      expect((await upload(id, { docType: "nid" }, [file()], "viewer")).statusCode).toBe(403);
      expect((await api("viewer", "PATCH", `/hr/employees/${id}/documents/${doc.id}`, { title: "x" })).statusCode).toBe(403);
      expect((await api("viewer", "DELETE", `/hr/employees/${id}/documents/${doc.id}`)).statusCode).toBe(403);

      // An editor can add, change and remove but not open or list.
      expect((await api("editor", "GET", `/hr/employees/${id}/documents`)).statusCode).toBe(403);
      expect((await api("editor", "GET", `/hr/employees/${id}/documents/${doc.id}/link`)).statusCode).toBe(403);
      expect((await upload(id, { docType: "cv" }, [file({ filename: "cv.pdf" })], "editor")).statusCode).toBe(201);
    });
  });

  describe("add", () => {
    it("stores the file under hrm/employees/<EMP ID and name>/<type>/<file> and records it", async () => {
      const employee = await hire(`${marker} Jane Doe`);
      const response = await upload(employee.id, { docType: "nid", note: "  front side  ", expiresOn: "2032-06-30" });
      expect(response.statusCode).toBe(201);
      const doc = response.json<DocumentBody>();

      expect(doc).toMatchObject({
        docType: "nid",
        title: "",
        fileName: "nid-front.pdf",
        contentType: "application/pdf",
        note: "front side",
        expiresOn: "2032-06-30",
        uploadedBy: `E2E ${emails.admin}`,
      });
      expect(doc.sizeBytes).toBe(file().content.length);

      const slug = `e2e-${RUN.toLowerCase()}-jane-doe`.slice(0, 40);
      const key = await keyOf(doc.id);
      expect(key).toBe(`hrm/employees/${employee.employeeId}-${slug}/nid/nid-front.pdf`);
      expect(objects.get(key)!.body.equals(file().content)).toBe(true);
      expect(objects.get(key)!.contentType).toBe("application/pdf");
    });

    it("never returns the object key or the employee's folder", async () => {
      const employee = await hire();
      await uploaded(employee.id);
      const listed = await api("admin", "GET", `/hr/employees/${employee.id}/documents`);
      expect(listed.body).not.toContain("hrm/");
      expect(listed.body).not.toContain("storageKey");
      expect(listed.body).not.toContain("storage_key");
    });

    it("reads the type from the file's content, not its name or declared type", async () => {
      const employee = await hire();
      const doc = await uploaded(employee.id, { docType: "passport" }, [
        file({ filename: "passport.pdf", type: "application/pdf", content: pngBytes() }),
      ]);
      expect(doc.contentType).toBe("image/png");
      expect(await keyOf(doc.id)).toMatch(/\/passport\/passport\.png$/);
    });

    it("takes every document type, and needs a title for Other", async () => {
      const employee = await hire();
      for (const docType of ["nid", "passport", "contract", "certificate", "cv"]) {
        expect((await upload(employee.id, { docType }, [file({ filename: `${docType}.pdf` })])).statusCode).toBe(201);
      }
      const noTitle = await upload(employee.id, { docType: "other" });
      expect(noTitle.statusCode).toBe(400);
      const withTitle = await upload(employee.id, { docType: "other", title: "Work visa" });
      expect(withTitle.statusCode).toBe(201);
      expect(withTitle.json<DocumentBody>().title).toBe("Work visa");
    });

    it("refuses a file that is not a PDF, JPEG, PNG or WebP, whatever it is called", async () => {
      const employee = await hire();
      const before = objects.size;
      const bad = [
        file({ filename: "nid.pdf", content: Buffer.from("<html><script>alert(1)</script></html>") }),
        file({ filename: "nid.pdf", content: Buffer.from("MZ\x90\x00 an executable") }),
        file({ filename: "nid.png", content: Buffer.from("PK\x03\x04 a docx") }),
        file({ content: Buffer.alloc(0) }),
      ];
      for (const upload_ of bad) {
        const response = await upload(employee.id, { docType: "nid" }, [upload_]);
        expect(response.statusCode).toBe(400);
        expect(response.json<{ details: Record<string, string> }>().details.file).toBeDefined();
      }
      expect(objects.size).toBe(before);
    });

    it("refuses a file over 5 MB and stores nothing", async () => {
      const employee = await hire();
      const before = objects.size;
      const big = file({ content: Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(5 * 1024 * 1024)]) });
      const response = await upload(employee.id, { docType: "nid" }, [big]);
      expect(response.statusCode).toBe(400);
      expect(response.json<{ details: Record<string, string> }>().details.file).toMatch(/5 MB/);
      expect(objects.size).toBe(before);
    });

    it("refuses a missing file, a second file, a differently named file and bad text fields", async () => {
      const employee = await hire();
      const before = objects.size;
      expect((await upload(employee.id, { docType: "nid" }, [])).statusCode).toBe(400);
      expect((await upload(employee.id, { docType: "nid" }, [file(), file({ filename: "b.pdf" })])).statusCode).toBe(400);
      expect((await upload(employee.id, { docType: "nid" }, [file({ field: "resume" })])).statusCode).toBe(400);
      expect((await upload(employee.id, {}, [file()])).statusCode).toBe(400);
      expect((await upload(employee.id, { docType: "licence" }, [file()])).statusCode).toBe(400);
      expect((await upload(employee.id, { docType: "nid", expiresOn: "2030-02-31" }, [file()])).statusCode).toBe(400);
      expect((await upload(employee.id, { docType: "nid", title: "x".repeat(101) }, [file()])).statusCode).toBe(400);
      expect((await upload(employee.id, { docType: "nid", note: "x".repeat(301) }, [file()])).statusCode).toBe(400);
      expect((await api("admin", "POST", `/hr/employees/${employee.id}/documents`, { docType: "nid" })).statusCode).toBe(400);
      expect(objects.size).toBe(before);
    });

    it("treats an empty expiry date as none", async () => {
      const employee = await hire();
      const doc = await uploaded(employee.id, { docType: "nid", expiresOn: "" });
      expect(doc.expiresOn).toBeNull();
    });

    it("answers 404 for an unknown employee and stores nothing", async () => {
      const before = objects.size;
      expect((await upload(randomUUID())).statusCode).toBe(404);
      expect((await api("admin", "GET", `/hr/employees/${randomUUID()}/documents`)).statusCode).toBe(404);
      expect(objects.size).toBe(before);
    });

    it("never replaces a file: the same name twice gets a short id on the second", async () => {
      const employee = await hire();
      const first = await uploaded(employee.id, { docType: "nid" }, [file({ filename: "scan.pdf", content: pdfBytes("first") })]);
      const second = await uploaded(employee.id, { docType: "nid" }, [
        file({ filename: "scan.pdf", content: pdfBytes("second") }),
      ]);

      const firstKey = await keyOf(first.id);
      const secondKey = await keyOf(second.id);
      expect(secondKey).not.toBe(firstKey);
      expect(secondKey).toBe(`${firstKey.replace(/\.pdf$/, "")}-${second.id.replace(/-/g, "").slice(-8)}.pdf`);
      expect(objects.get(firstKey)!.body.toString()).toContain("first");
      expect(objects.get(secondKey)!.body.toString()).toContain("second");
    });

    it("keeps hostile file names inside the folder", async () => {
      const employee = await hire();
      for (const filename of ["../../other/secret.pdf", "..\\..\\x.pdf", "/etc/passwd", ".hidden.pdf", "a%2F..%2Fb.pdf"]) {
        const doc = await uploaded(employee.id, { docType: "contract" }, [file({ filename })]);
        const key = await keyOf(doc.id);
        expect(key).toMatch(new RegExp(`^hrm/employees/${employee.employeeId}-[a-z0-9-]+/contract/[^/\\\\]+\\.pdf$`));
        expect(key).not.toContain("..");
        expect(doc.fileName).not.toMatch(/[\\/]/);
      }
    });

    it("uses just the EMP ID as the folder for a name with no Latin letters", async () => {
      const employee = await hire("রহিম উদ্দিন");
      await pool.query(`update hr.employees set full_name = $2 where id = $1`, [employee.id, `${marker} ${"রহিম উদ্দিন"}`]);
      const doc = await uploaded(employee.id);
      expect(await keyOf(doc.id)).toMatch(new RegExp(`^hrm/employees/${employee.employeeId}-e2e-[a-z0-9]+/nid/`));
      await pool.query(`update hr.employees set full_name = $2 where id = $1`, [employee.id, "রহিম উদ্দিন"]);
      const bare = await uploaded(employee.id, { docType: "cv" });
      expect(await keyOf(bare.id)).toMatch(new RegExp(`^hrm/employees/${employee.employeeId}/cv/`));
      await pool.query(`update hr.employees set full_name = $2 where id = $1`, [employee.id, `${marker} fixed`]);
    });

    it("keeps older files where they are when the person is renamed", async () => {
      const employee = await hire(`${marker} Before`);
      const doc = await uploaded(employee.id);
      const oldKey = await keyOf(doc.id);
      expect((await api("admin", "PATCH", `/hr/employees/${employee.id}`, { fullName: `${marker} After` })).statusCode).toBe(200);
      const next = await uploaded(employee.id, { docType: "cv" });
      expect(await keyOf(doc.id)).toBe(oldKey);
      expect(objects.has(oldKey)).toBe(true);
      expect(await keyOf(next.id)).toContain("-e2e-");
      expect((await api("admin", "GET", `/hr/employees/${employee.id}/documents/${doc.id}/link`)).statusCode).toBe(200);
    });

    it("allows at most 50 documents per employee", async () => {
      const employee = await hire();
      await pool.query(
        `insert into hr.employee_documents (id, employee_id, doc_type, file_name, storage_key, content_type, size_bytes)
         select gen_random_uuid(), $1::uuid, 'other', 'f.pdf', 'e2e-fill-${RUN}-' || gs, 'application/pdf', 10 from generate_series(1, 50) gs`,
        [employee.id],
      );
      const full = await upload(employee.id, { docType: "nid" });
      expect(full.statusCode).toBe(409);
      const keys = [...objects.keys()].filter((key) => key.includes(employee.employeeId));
      expect(keys).toEqual([]);
    });

    it("answers 503 when storage fails, and leaves no row", async () => {
      const employee = await hire();
      putSpy.mockRejectedValueOnce(new StorageUnavailableError());
      const response = await upload(employee.id);
      expect(response.statusCode).toBe(503);
      expect((await api("admin", "GET", `/hr/employees/${employee.id}/documents`)).json<{ items: unknown[] }>().items).toEqual(
        [],
      );
    });

    it("removes the stored file again when the record cannot be saved", async () => {
      const employee = await hire();
      const before = new Set(objects.keys());
      jest.spyOn(app.get(AuditService), "record").mockRejectedValueOnce(new Error("audit down"));
      const response = await upload(employee.id);
      expect(response.statusCode).toBe(500);
      expect([...objects.keys()].filter((key) => !before.has(key))).toEqual([]);
      expect((await api("admin", "GET", `/hr/employees/${employee.id}/documents`)).json<{ items: unknown[] }>().items).toEqual(
        [],
      );
    });
  });

  describe("list, link, update and remove", () => {
    it("lists the documents oldest first", async () => {
      const employee = await hire();
      const a = await uploaded(employee.id, { docType: "nid" }, [file({ filename: "a.pdf" })]);
      const b = await uploaded(employee.id, { docType: "passport" }, [file({ filename: "b.pdf" })]);
      const listed = (await api("admin", "GET", `/hr/employees/${employee.id}/documents`)).json<{ items: DocumentBody[] }>();
      expect(listed.items.map((item) => item.id)).toEqual([a.id, b.id]);
    });

    it("hands out a link that lasts five minutes, and audits each request", async () => {
      const employee = await hire();
      const doc = await uploaded(employee.id);
      const key = await keyOf(doc.id);

      const response = await api("admin", "GET", `/hr/employees/${employee.id}/documents/${doc.id}/link`);
      expect(response.statusCode).toBe(200);
      const { url, expiresAt } = response.json<{ url: string; expiresAt: string }>();
      const link = new URL(url);
      expect(link.hostname).toBe("test-private-bucket.test-account.r2.cloudflarestorage.com");
      expect(decodeURIComponent(link.pathname)).toBe(`/${key}`);
      expect(link.searchParams.get("X-Amz-Expires")).toBe("300");
      expect(new Date(expiresAt).getTime() - Date.now()).toBeGreaterThan(290_000);
      expect(new Date(expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(300_000);

      await api("viewer", "GET", `/hr/employees/${employee.id}/documents/${doc.id}/link`);
      const audit = await pool.query<{ action: string; metadata: { documentId: string; docType: string } }>(
        `select action, metadata from core.audit_log where action = 'hr.document.viewed' and entity_id = $1`,
        [employee.id],
      );
      expect(audit.rows).toHaveLength(2);
      expect(audit.rows[0]!.metadata).toEqual({ documentId: doc.id, docType: "nid" });
    });

    it("answers 404 for a missing file, another employee's document, and unknown ids", async () => {
      const a = await hire();
      const b = await hire();
      const doc = await uploaded(a.id);
      objects.delete(await keyOf(doc.id));

      expect((await api("admin", "GET", `/hr/employees/${a.id}/documents/${doc.id}/link`)).statusCode).toBe(404);
      const other = await uploaded(b.id);
      expect((await api("admin", "GET", `/hr/employees/${a.id}/documents/${other.id}/link`)).statusCode).toBe(404);
      expect((await api("admin", "PATCH", `/hr/employees/${a.id}/documents/${other.id}`, { title: "x" })).statusCode).toBe(404);
      expect((await api("admin", "DELETE", `/hr/employees/${a.id}/documents/${other.id}`)).statusCode).toBe(404);
      expect((await api("admin", "GET", `/hr/employees/${a.id}/documents/${randomUUID()}/link`)).statusCode).toBe(404);
      expect((await api("admin", "GET", `/hr/employees/${a.id}/documents/not-an-id/link`)).statusCode).toBe(400);
    });

    it("edits the title, expiry and note, but not the type or the file", async () => {
      const employee = await hire();
      const doc = await uploaded(employee.id, { docType: "passport", expiresOn: "2030-01-01" });
      const key = await keyOf(doc.id);

      const updated = await api("admin", "PATCH", `/hr/employees/${employee.id}/documents/${doc.id}`, {
        title: " Main passport ",
        expiresOn: "2035-01-01",
        note: "renewed",
        docType: "cv",
        storageKey: "elsewhere",
      });
      expect(updated.statusCode).toBe(200);
      expect(updated.json<DocumentBody>()).toMatchObject({
        docType: "passport",
        title: "Main passport",
        expiresOn: "2035-01-01",
        note: "renewed",
      });
      expect(await keyOf(doc.id)).toBe(key);

      const cleared = await api("admin", "PATCH", `/hr/employees/${employee.id}/documents/${doc.id}`, { expiresOn: null });
      expect(cleared.json<DocumentBody>().expiresOn).toBeNull();
      expect((await api("admin", "PATCH", `/hr/employees/${employee.id}/documents/${doc.id}`, {})).statusCode).toBe(400);
      expect(
        (await api("admin", "PATCH", `/hr/employees/${employee.id}/documents/${doc.id}`, { expiresOn: "2035-02-30" })).statusCode,
      ).toBe(400);
    });

    it("does not let an Other document lose its title", async () => {
      const employee = await hire();
      const doc = await uploaded(employee.id, { docType: "other", title: "Visa" });
      expect((await api("admin", "PATCH", `/hr/employees/${employee.id}/documents/${doc.id}`, { title: "  " })).statusCode).toBe(
        400,
      );
    });

    it("removes the row and the file", async () => {
      const employee = await hire();
      const doc = await uploaded(employee.id);
      const key = await keyOf(doc.id);
      expect((await api("admin", "DELETE", `/hr/employees/${employee.id}/documents/${doc.id}`)).statusCode).toBe(204);
      expect(objects.has(key)).toBe(false);
      expect((await api("admin", "GET", `/hr/employees/${employee.id}/documents`)).json<{ items: unknown[] }>().items).toEqual(
        [],
      );
      expect((await api("admin", "DELETE", `/hr/employees/${employee.id}/documents/${doc.id}`)).statusCode).toBe(404);
    });

    it("still removes the row when the file cannot be deleted", async () => {
      const employee = await hire();
      const doc = await uploaded(employee.id);
      deleteSpy.mockRejectedValueOnce(new StorageUnavailableError());
      expect((await api("admin", "DELETE", `/hr/employees/${employee.id}/documents/${doc.id}`)).statusCode).toBe(204);
      expect((await api("admin", "GET", `/hr/employees/${employee.id}/documents`)).json<{ items: unknown[] }>().items).toEqual(
        [],
      );
    });
  });

  describe("with the employee", () => {
    it("removes every file when an employee created by mistake is deleted", async () => {
      const employee = await hire();
      const a = await uploaded(employee.id, { docType: "nid" }, [file({ filename: "a.pdf" })]);
      const b = await uploaded(employee.id, { docType: "cv" }, [file({ filename: "b.pdf" })]);
      const keys = [await keyOf(a.id), await keyOf(b.id)];
      expect(keys.every((key) => objects.has(key))).toBe(true);

      expect((await api("admin", "DELETE", `/hr/employees/${employee.id}`)).statusCode).toBe(204);
      expect(keys.some((key) => objects.has(key))).toBe(false);
      const rows = await pool.query<{ total: number }>(
        `select count(*)::int as total from hr.employee_documents where employee_id = $1`,
        [employee.id],
      );
      expect(rows.rows[0]!.total).toBe(0);
    });

    it("keeps the files of someone marked as left", async () => {
      const employee = await hire();
      const doc = await uploaded(employee.id);
      const left = await api("admin", "POST", `/hr/employees/${employee.id}/leave`, {
        leftOn: addDays(dhakaToday(), -1),
        exitType: "resigned",
      });
      expect(left.statusCode).toBe(200);
      expect(objects.has(await keyOf(doc.id))).toBe(true);
      expect((await api("admin", "GET", `/hr/employees/${employee.id}/documents/${doc.id}/link`)).statusCode).toBe(200);
    });

    it("keeps file names, notes, titles and the employee's name out of the audit log", async () => {
      const employee = await hire(`${marker} Secret Name`);
      const doc = await uploaded(employee.id, { docType: "other", title: "Confidential visa", note: "private note" }, [
        file({ filename: "very-private-scan.pdf" }),
      ]);
      await api("admin", "PATCH", `/hr/employees/${employee.id}/documents/${doc.id}`, { title: "Another private title" });
      await api("admin", "GET", `/hr/employees/${employee.id}/documents/${doc.id}/link`);
      await api("admin", "DELETE", `/hr/employees/${employee.id}/documents/${doc.id}`);

      const rows = await pool.query<{ action: string; metadata: string }>(
        `select action, metadata::text as metadata from core.audit_log where actor_id = $1 and action like 'hr.document.%'`,
        [adminId],
      );
      const actions = rows.rows.map((row) => row.action);
      expect(actions).toEqual(
        expect.arrayContaining(["hr.document.added", "hr.document.updated", "hr.document.viewed", "hr.document.removed"]),
      );
      const everything = JSON.stringify(rows.rows);
      for (const secret of ["very-private-scan", "Confidential", "private", "Secret Name", "E2E", "hrm/"])
        expect(everything).not.toContain(secret);
    });
  });

  describe("dashboard stats", () => {
    interface Stats {
      headcount: number;
      joinedThisMonth: number;
      expiringDocuments: number;
      expiredDocuments: number;
      expiring: { employeeId: string; fullName: string; docType: string; expiresOn: string }[];
    }
    const stats = async () => (await api("admin", "GET", "/hr/stats")).json<Stats>();

    it("needs hr.employee.read", async () => {
      expect((await api("none", "GET", "/hr/stats")).statusCode).toBe(401);
      expect((await api("viewer", "GET", "/hr/stats")).statusCode).toBe(403);
    });

    it("counts a new hire and flags documents that expire soon or have expired, but not later ones", async () => {
      const before = await stats();
      const person = await hire(`${marker} Stats`);
      const afterHire = await stats();
      expect(afterHire.headcount).toBe(before.headcount + 1);

      const today = dhakaToday();
      await uploaded(person.id, { docType: "passport", expiresOn: addDays(today, 10) });
      await uploaded(person.id, { docType: "contract", expiresOn: addDays(today, -5) });
      await uploaded(person.id, { docType: "nid", expiresOn: addDays(today, 200) });

      const after = await stats();
      expect(after.expiringDocuments).toBe(before.expiringDocuments + 2);
      expect(after.expiredDocuments).toBe(before.expiredDocuments + 1);
      const mine = after.expiring.filter((item) => item.employeeId === person.id).map((item) => item.docType);
      expect(mine.every((type) => type === "passport" || type === "contract")).toBe(true);
      expect(JSON.stringify(after)).not.toContain("hrm/");
    });

    it("leaves out documents of someone who has left", async () => {
      const person = await hire(`${marker} Stats Gone`);
      await uploaded(person.id, { docType: "passport", expiresOn: addDays(dhakaToday(), 3) });
      const before = await stats();
      const left = await api("admin", "POST", `/hr/employees/${person.id}/leave`, {
        leftOn: addDays(dhakaToday(), -1),
        exitType: "resigned",
      });
      expect(left.statusCode).toBe(200);
      const after = await stats();
      expect(after.expiringDocuments).toBe(before.expiringDocuments - 1);
      expect(after.headcount).toBe(before.headcount - 1);
    });
  });
});
