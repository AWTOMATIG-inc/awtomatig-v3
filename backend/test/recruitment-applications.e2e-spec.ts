import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { resumeFolder } from "../src/modules/recruitment/domain/application";
import { ApplicationsRepo } from "../src/modules/recruitment/repo/applications.repo";
import { createApp } from "../src/bootstrap";
import { users } from "../src/shared/auth/auth.schema";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";
import { StorageUnavailableError } from "../src/shared/storage/storage.errors";
import { StorageService } from "../src/shared/storage/storage.service";

// Public careers endpoints, the application submission and the employee review screens, against a real, migrated PostgreSQL
// (backend/RULES.md section 6). Storage is replaced by an in-memory fake, so nothing touches R2. It creates its own users, roles,
// jobs and applications and removes them afterwards. Skipped unless TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://… npm test -- recruitment-applications.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";
const INGEST = { "x-ingest-key": process.env.LEAD_INGEST_KEY ?? "" };
const RUN = randomUUID().slice(0, 8);
const MB = 1024 * 1024;

/** A `YYYY-MM-DD` date `days` from now, in Dhaka, which is the clock the module uses. */
function dhakaDay(days: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(Date.now() + days * 86_400_000),
  );
}

interface JobBody {
  id: string;
  title: string;
  slug: string;
  applicationCount: number;
  newApplicationCount: number;
  questions: { id: string; text: string; required: boolean }[];
}

interface StatsBody {
  openJobs: number;
  closingSoon: number;
  closingSoonDays: number;
  newApplications: number;
  staleAfterDays: number;
  staleCount: number;
  stale: { id: string; fullName: string; jobId: string; jobTitle: string; createdAt: string }[];
}

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

interface ApplicationBody {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  jobId: string;
  resume: { name: string; size: number };
  educations: { degree: string; completedOn: string | null; ongoing: boolean; grade: string }[];
  experiences: { company: string; toOn: string | null; current: boolean }[];
  answers: { question: string; answer: string }[];
}

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
const resumeFile = (patch: Partial<UploadedFile> = {}): UploadedFile => ({
  field: "resume",
  filename: "My CV.pdf",
  type: "application/pdf",
  content: pdfBytes("a real-looking resume"),
  ...patch,
});

describeWithDb("Recruitment applications (real PostgreSQL, fake storage)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const staffEmail = `e2e-staff-${RUN}@test.invalid`;
  const jobsOnlyEmail = `e2e-jobsonly-${RUN}@test.invalid`;
  const roleNames = [`e2e-recapp-${RUN}`, `e2e-recjobs-${RUN}`];
  const marker = `E2E ${RUN}`;
  let staffCookie = "";
  let jobsOnlyCookie = "";

  // The fake bucket: object key -> bytes.
  const objects = new Map<string, Buffer>();
  let putSpy: jest.SpyInstance;
  let deleteSpy: jest.SpyInstance;

  let job: JobBody;
  let phoneCounter = 0;
  // A valid 017 mobile number, different on every call so tests never collide with each other.
  const phone = () => `01711${String(100000 + ++phoneCounter)}`;

  const education = { degree: "BSc", fieldOfStudy: "Computer Science", institution: "AUST", completedOn: "2025-11-20" };
  const payload = (patch: Record<string, unknown> = {}) => ({
    submissionId: randomUUID(),
    fullName: `${marker} Candidate`,
    email: `cand-${randomUUID().slice(0, 8)}@test.invalid`,
    phone: phone(),
    educations: [education],
    consent: true,
    ...patch,
  });

  const api = (method: "GET" | "POST" | "PATCH", url: string, options: { payload?: object; cookie?: string } = {}) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      payload: options.payload,
      headers: options.cookie ? { cookie: options.cookie } : {},
    });
  const asStaff = (method: "GET" | "POST" | "PATCH", url: string, body?: object) =>
    api(method, url, { payload: body, cookie: staffCookie });

  function apply(
    slug: string,
    body: Record<string, unknown> | string,
    options: { files?: UploadedFile[]; headers?: Record<string, string>; fields?: Record<string, string> } = {},
  ) {
    const form = multipart(
      { ...(typeof body === "string" ? { payload: body } : { payload: JSON.stringify(body) }), ...options.fields },
      options.files ?? [resumeFile()],
    );
    return app.inject({
      method: "POST",
      url: `/api/v1/recruitment/public/jobs/${slug}/applications`,
      payload: form.body,
      headers: { "content-type": form.contentType, ...(options.headers ?? INGEST) },
    });
  }

  async function createJob(patch: Record<string, unknown> = {}): Promise<JobBody> {
    const response = await asStaff("POST", "/recruitment/jobs", {
      title: `${marker} Designer`,
      jobType: "full_time",
      workMode: "onsite",
      vacancies: 1,
      location: "Dhaka",
      officeTiming: "Mon - Fri",
      description: "Design things.",
      deadlineOn: dhakaDay(14),
      publish: true,
      ...patch,
    });
    expect(response.statusCode).toBe(201);
    return response.json<JobBody>();
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

  const row = async <T extends object>(sql: string, params: unknown[]) => (await pool.query<T>(sql, params)).rows;

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
      await db.insert(rolePermissions).values(permissions.map((permission) => ({ roleId: role!.id, permission })));
      await db.insert(userRoles).values({ userId: user!.id, roleId: role!.id });
    };
    await makeUser(staffEmail, roleNames[0]!, ["recruitment.*"]);
    await makeUser(jobsOnlyEmail, roleNames[1]!, ["recruitment.job.read", "recruitment.job.create", "recruitment.job.update"]);

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const storage = app.get(StorageService);
    // Like R2's conditional upload: a key that is already taken is refused, never overwritten.
    putSpy = jest.spyOn(storage, "putIfAbsent").mockImplementation((key, body) => {
      if (objects.has(key)) return Promise.resolve(false);
      objects.set(key, body);
      return Promise.resolve(true);
    });
    deleteSpy = jest.spyOn(storage, "delete").mockImplementation((key) => {
      objects.delete(key);
      return Promise.resolve();
    });
    jest.spyOn(storage, "head").mockImplementation((key) => {
      const object = objects.get(key);
      return Promise.resolve(object ? { size: object.length, contentType: "application/pdf" } : null);
    });

    staffCookie = await signIn(staffEmail);
    jobsOnlyCookie = await signIn(jobsOnlyEmail);
    job = await createJob({
      questions: [{ text: "Why do you want this job?" }, { text: "A link to your best work", required: false }],
    });
  });

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    // Only this run's rows: the other e2e suites share the database and run in parallel.
    const ourJobs = `select id from recruitment.jobs where title like $1`;
    const ourApps = `select id from recruitment.applications where job_id in (${ourJobs})`;
    const like1 = [`${marker}%`];
    await pool.query(
      `delete from core.audit_log where entity_id in (select id::text from recruitment.jobs where title like $1) or entity_id in (select id::text from recruitment.applications where job_id in (${ourJobs}))`,
      like1,
    );
    for (const table of ["application_answers", "application_educations", "application_experiences"]) {
      await pool.query(`delete from recruitment.${table} where application_id in (${ourApps})`, like1);
    }
    await pool.query(`delete from recruitment.applications where job_id in (${ourJobs})`, like1);
    await pool.query(`delete from recruitment.job_questions where job_id in (${ourJobs})`, like1);
    await pool.query(`delete from recruitment.jobs where title like $1`, like1);
    await db.delete(users).where(like(users.email, `e2e-%-${RUN}@test.invalid`));
    for (const name of roleNames) await db.delete(roles).where(eq(roles.name, name));
    await pool.end();
  });

  describe("the public careers endpoints", () => {
    it("list open jobs, then recently closed ones flagged as closed, with nothing internal", async () => {
      const draft = await createJob({ title: `${marker} Draft`, publish: false });
      const closed = await createJob({ title: `${marker} Closed` });
      await asStaff("POST", `/recruitment/jobs/${closed.id}/close`);
      const lapsed = await createJob({ title: `${marker} Lapsed` });
      await pool.query(`update recruitment.jobs set deadline_on = $2 where id = $1`, [lapsed.id, dhakaDay(-1)]);
      const old = await createJob({ title: `${marker} Old` });
      await pool.query(`update recruitment.jobs set deadline_on = $2 where id = $1`, [old.id, dhakaDay(-45)]);

      const response = await api("GET", "/recruitment/public/jobs");
      expect(response.statusCode).toBe(200);
      const items = response.json<{ items: Record<string, unknown>[] }>().items;
      const slugs = items.map((item) => item.slug);

      expect(slugs).toContain(job.slug);
      for (const hidden of [draft, old]) expect(slugs).not.toContain(hidden.slug);
      for (const shown of [closed, lapsed]) {
        expect(items.find((item) => item.slug === shown.slug)).toMatchObject({ acceptingApplications: false });
      }
      // Jobs taking applications come before the closed ones.
      expect(slugs.indexOf(job.slug)).toBeLessThan(slugs.indexOf(closed.slug));
      expect(slugs.indexOf(job.slug)).toBeLessThan(slugs.indexOf(lapsed.slug));
      const mine = items.find((item) => item.slug === job.slug)!;
      expect(Object.keys(mine).sort()).toEqual(
        [
          "acceptingApplications",
          "deadlineOn",
          "jobType",
          "location",
          "officeTiming",
          "publishedAt",
          "salaryMax",
          "salaryMin",
          "slug",
          "title",
          "vacancies",
          "workMode",
        ].sort(),
      );
    });

    it("lists the soonest deadline first", async () => {
      const later = await createJob({ title: `${marker} Later`, deadlineOn: dhakaDay(60) });
      const sooner = await createJob({ title: `${marker} Sooner`, deadlineOn: dhakaDay(3) });
      const items = (await api("GET", "/recruitment/public/jobs")).json<{ items: { slug: string }[] }>().items;
      expect(items.findIndex((item) => item.slug === sooner.slug)).toBeLessThan(
        items.findIndex((item) => item.slug === later.slug),
      );
    });

    it("show one job with its questions, and a closed job with the flag off", async () => {
      const open = (await api("GET", `/recruitment/public/jobs/${job.slug}`)).json<Record<string, unknown>>();
      expect(open).toMatchObject({ title: `${marker} Designer`, acceptingApplications: true, description: "Design things." });
      expect((open.questions as { text: string }[]).map((question) => question.text)).toEqual([
        "Why do you want this job?",
        "A link to your best work",
      ]);
      expect(open).not.toHaveProperty("status");
      expect(open).not.toHaveProperty("id");

      const closed = await createJob({ title: `${marker} ClosedDetail` });
      await asStaff("POST", `/recruitment/jobs/${closed.id}/close`);
      const response = await api("GET", `/recruitment/public/jobs/${closed.slug}`);
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ acceptingApplications: false });
    });

    it("answer 404 for a draft and for an unknown slug", async () => {
      const draft = await createJob({ title: `${marker} Hidden`, publish: false });
      expect((await api("GET", `/recruitment/public/jobs/${draft.slug}`)).statusCode).toBe(404);
      expect((await api("GET", "/recruitment/public/jobs/no-such-job-000000")).statusCode).toBe(404);
    });
  });

  describe("submitting an application", () => {
    const [whyUs, portfolio] = [0, 1];
    const answers = (extra = "") => [
      { questionId: job.questions[whyUs]!.id, answer: `Because of the craft. ${extra}` },
      { questionId: job.questions[portfolio]!.id, answer: "https://example.com/work" },
    ];
    let firstEmail = "";
    let firstPhone = "";
    let firstId = "";
    const firstSubmission = randomUUID();

    it("needs the shared ingest key", async () => {
      expect((await apply(job.slug, payload(), { headers: {} })).statusCode).toBe(401);
      expect((await apply(job.slug, payload(), { headers: { "x-ingest-key": "wrong" } })).statusCode).toBe(401);
      expect(putSpy).not.toHaveBeenCalled();
    });

    it("stores the application, its rows and the resume under the job and application ids", async () => {
      firstEmail = `Rahim-${RUN}@Example.com`;
      firstPhone = "+88 01712-345678";
      const body = payload({
        submissionId: firstSubmission,
        email: firstEmail,
        phone: firstPhone,
        githubUrl: "https://github.com/rahim",
        linkedinUrl: "",
        educations: [education, { degree: "MSc", fieldOfStudy: "CSE", institution: "BUET", ongoing: true, grade: "CGPA 3.8" }],
        experiences: [
          { company: "Acme", title: "Developer", fromOn: "2022-01-01", toOn: "2024-01-01", responsibilities: "Built things" },
          { company: "Beta", title: "Lead", fromOn: "2024-02-01", current: true, responsibilities: "Runs things" },
        ],
        answers: answers(),
      });
      const response = await apply(job.slug, body);

      expect(response.statusCode).toBe(201);
      firstId = response.json<{ id: string }>().id;
      expect(putSpy).toHaveBeenCalledTimes(1);
      const [key, bytes, type] = putSpy.mock.calls[0] as [string, Buffer, string];
      expect(key).toBe(`career/${resumeFolder(job.title)}/My CV.pdf`);
      expect(type).toBe("application/pdf");
      expect(bytes.toString()).toContain("%PDF-");
      expect(objects.has(key)).toBe(true);

      const [stored] = await row<{
        email: string;
        phone: string;
        email_normalized: string;
        phone_normalized: string;
        resume_key: string;
        resume_name: string;
        resume_size: number;
        status: string;
        github_url: string | null;
        linkedin_url: string | null;
        consented_at: Date | null;
      }>(`select * from recruitment.applications where id = $1`, [firstId]);
      expect(stored).toMatchObject({
        email: firstEmail,
        phone: firstPhone,
        email_normalized: firstEmail.toLowerCase(),
        phone_normalized: "8801712345678",
        resume_key: key,
        resume_name: "My CV.pdf",
        resume_size: bytes.length,
        status: "new",
        github_url: "https://github.com/rahim",
        linkedin_url: null,
      });
      expect(stored?.consented_at).not.toBeNull();

      const counts = await row<{ n: number }>(
        `select (select count(*) from recruitment.application_educations where application_id = $1)::int
              + (select count(*) from recruitment.application_experiences where application_id = $1)::int * 100
              + (select count(*) from recruitment.application_answers where application_id = $1)::int * 10000 as n`,
        [firstId],
      );
      expect(counts[0]?.n).toBe(2 + 200 + 20000);
    });

    it("copies the question text into the answer", async () => {
      const [stored] = await row<{ question_text: string }>(
        `select question_text from recruitment.application_answers where application_id = $1 and position = 0`,
        [firstId],
      );
      expect(stored?.question_text).toBe("Why do you want this job?");
    });

    it("returns the stored application for a retry and uploads nothing more", async () => {
      const uploads = putSpy.mock.calls.length;
      const retry = await apply(job.slug, payload({ submissionId: firstSubmission, answers: answers() }));
      expect(retry.statusCode).toBe(201);
      expect(retry.json()).toEqual({ id: firstId });
      expect(putSpy.mock.calls.length).toBe(uploads);
      expect(await row(`select 1 from recruitment.applications where submission_id = $1`, [firstSubmission])).toHaveLength(1);
    });

    it("keeps the candidate's details out of the audit log", async () => {
      const rows = await row<{ action: string; metadata: unknown }>(
        `select action, metadata from core.audit_log where entity_id = $1`,
        [firstId],
      );
      expect(rows.map((entry) => entry.action)).toEqual(["recruitment.application.submitted"]);
      const text = JSON.stringify(rows);
      for (const secret of ["Rahim", "example.com", "01712", "Because of the craft", "github", "My CV"]) {
        expect(text).not.toContain(secret);
      }
    });

    it("refuses a second application with the same email, however it is typed", async () => {
      const uploads = putSpy.mock.calls.length;
      const response = await apply(job.slug, payload({ email: `  ${firstEmail.toUpperCase()} `, answers: answers() }));
      expect(response.statusCode).toBe(409);
      expect(response.json<ErrorBody>()).toMatchObject({
        code: "ALREADY_APPLIED",
        message: "You have already applied for this position",
      });
      expect(putSpy.mock.calls.length).toBe(uploads);
    });

    it("refuses a second application with the same phone number in another format", async () => {
      for (const sameNumber of ["01712345678", "+8801712345678", "8801712345678", "008801712345678", "1712345678"]) {
        const response = await apply(job.slug, payload({ phone: sameNumber, answers: answers() }));
        expect(response.statusCode).toBe(409);
        expect(response.json<ErrorBody>().code).toBe("ALREADY_APPLIED");
      }
    });

    it("lets the same person apply to a different job", async () => {
      const other = await createJob({ title: `${marker} Other job` });
      const response = await apply(other.slug, payload({ email: firstEmail, phone: firstPhone }));
      expect(response.statusCode).toBe(201);
    });

    it("stores each resume under the job title with the candidate's own file name, and never replaces another candidate's file", async () => {
      const titled = await createJob({ title: `${marker} Dev/Ops: Lead?` });
      const folder = resumeFolder(titled.title);
      expect(folder).not.toContain("/");

      const first = await apply(titled.slug, payload({ answers: [] }), {
        files: [resumeFile({ filename: "resume.pdf", content: pdfBytes("first candidate") })],
      });
      const second = await apply(titled.slug, payload({ answers: [] }), {
        files: [resumeFile({ filename: "resume.pdf", content: pdfBytes("second candidate") })],
      });
      expect([first.statusCode, second.statusCode]).toEqual([201, 201]);

      const keys = await row<{ id: string; resume_key: string; resume_name: string }>(
        `select id, resume_key, resume_name from recruitment.applications where job_id = $1 order by created_at`,
        [titled.id],
      );
      expect(keys).toHaveLength(2);
      expect(keys[0]?.resume_key).toBe(`career/${folder}/resume.pdf`);
      // The second candidate's file keeps the same name plus a short piece of the application id
      expect(keys[1]?.resume_key).toBe(`career/${folder}/resume-${keys[1]?.id.replace(/-/g, "").slice(-8)}.pdf`);
      expect(keys.map((k) => k.resume_name)).toEqual(["resume.pdf", "resume.pdf"]);
      // Neither file was replaced
      expect(objects.get(keys[0]!.resume_key)?.toString()).toContain("first candidate");
      expect(objects.get(keys[1]!.resume_key)?.toString()).toContain("second candidate");
    });

    it("stores simultaneous resumes with the same file name under different names", async () => {
      const busy = await createJob({ title: `${marker} Busy` });
      const responses = await Promise.all(
        [1, 2, 3].map((n) =>
          apply(busy.slug, payload({ answers: [] }), {
            files: [resumeFile({ filename: "CV.pdf", content: pdfBytes(`candidate ${n}`) })],
          }),
        ),
      );
      expect(responses.map((r) => r.statusCode)).toEqual([201, 201, 201]);
      const keys = (
        await row<{ resume_key: string }>(`select resume_key from recruitment.applications where job_id = $1`, [busy.id])
      ).map((r) => r.resume_key);
      expect(new Set(keys).size).toBe(3);
      expect(keys.filter((key) => objects.has(key))).toHaveLength(3);
    });

    it("lets only one of two simultaneous submissions through and removes the loser's file", async () => {
      const twin = await createJob({ title: `${marker} Race` });
      const email = `race-${RUN}@test.invalid`;
      const sharedPhone = phone();

      const [a, b] = await Promise.all([
        apply(twin.slug, payload({ email, phone: sharedPhone })),
        apply(twin.slug, payload({ email, phone: sharedPhone })),
      ]);

      expect([a.statusCode, b.statusCode].sort()).toEqual([201, 409]);
      const loser = a.statusCode === 409 ? a : b;
      expect(loser.json<ErrorBody>().code).toBe("ALREADY_APPLIED");
      expect(await row(`select 1 from recruitment.applications where job_id = $1`, [twin.id])).toHaveLength(1);
      // The winner's file stays, the loser's is gone: exactly one object is left under this job.
      const left = [...objects.keys()].filter((key) => key.startsWith(`career/${resumeFolder(twin.title)}/`));
      expect(left).toHaveLength(1);
    });

    it("refuses a closed job, an expired job, a draft and an unknown job", async () => {
      const closed = await createJob({ title: `${marker} ClosedApply` });
      await asStaff("POST", `/recruitment/jobs/${closed.id}/close`);
      const expired = await createJob({ title: `${marker} ExpiredApply` });
      await pool.query(`update recruitment.jobs set deadline_on = $2 where id = $1`, [expired.id, dhakaDay(-1)]);
      const draft = await createJob({ title: `${marker} DraftApply`, publish: false });

      for (const target of [closed, expired]) {
        const response = await apply(target.slug, payload());
        expect(response.statusCode).toBe(409);
        expect(response.json<ErrorBody>().code).toBe("NOT_ACCEPTING_APPLICATIONS");
      }
      expect((await apply(draft.slug, payload())).statusCode).toBe(404);
      expect((await apply("no-such-job-000000", payload())).statusCode).toBe(404);
    });

    it("still accepts applications on the last day", async () => {
      const today = await createJob({ title: `${marker} LastDay`, deadlineOn: dhakaDay(0) });
      expect((await apply(today.slug, payload())).statusCode).toBe(201);
    });

    it("needs an answer to every required question, and only to this job's questions", async () => {
      const missing = await apply(job.slug, payload({ answers: [{ questionId: job.questions[portfolio]!.id, answer: "x" }] }));
      expect(missing.statusCode).toBe(400);
      expect(missing.json<ErrorBody>().message).toMatch(/required/i);

      const blank = await apply(job.slug, payload({ answers: [{ questionId: job.questions[whyUs]!.id, answer: "   " }] }));
      expect(blank.statusCode).toBe(400);

      const foreign = await apply(
        job.slug,
        payload({ answers: [...answers(), { questionId: randomUUID(), answer: "from nowhere" }] }),
      );
      expect(foreign.statusCode).toBe(400);

      const twice = await apply(job.slug, payload({ answers: [...answers(), ...answers()] }));
      expect(twice.statusCode).toBe(400);
    });

    it("does not store a blank answer to an optional question", async () => {
      const response = await apply(
        job.slug,
        payload({
          answers: [
            { questionId: job.questions[whyUs]!.id, answer: "Yes" },
            { questionId: job.questions[portfolio]!.id, answer: "  " },
          ],
        }),
      );
      expect(response.statusCode).toBe(201);
      const stored = await row<{ n: number }>(
        `select count(*)::int as n from recruitment.application_answers where application_id = $1`,
        [response.json<{ id: string }>().id],
      );
      expect(stored[0]?.n).toBe(1);
    });

    it.each([
      ["a missing name", { fullName: " " }],
      ["a bad email", { email: "nope" }],
      ["a bad phone", { phone: "12345" }],
      ["no education", { educations: [] }],
      ["no consent", { consent: false }],
      ["a link to the wrong site", { githubUrl: "https://example.com/rahim" }],
    ])("rejects %s with details the form can show", async (_name, patch) => {
      const response = await apply(job.slug, payload({ ...patch, answers: answers() }));
      expect(response.statusCode).toBe(400);
      const body = response.json<ErrorBody>();
      expect(body.code).toBe("VALIDATION_FAILED");
      expect(Array.isArray(body.details)).toBe(true);
    });

    describe("the resume", () => {
      const base = () => payload({ answers: answers() });
      const rejected = async (files: UploadedFile[]) => {
        const uploads = putSpy.mock.calls.length;
        const response = await apply(job.slug, base(), { files });
        expect(response.statusCode).toBe(400);
        expect(response.json<ErrorBody>().code).toBe("VALIDATION_FAILED");
        expect(putSpy.mock.calls.length).toBe(uploads);
        return response.json<ErrorBody>();
      };

      it("is required", async () => {
        await rejected([]);
      });

      it("must be a PDF by name and by type", async () => {
        await rejected([resumeFile({ filename: "cv.docx" })]);
        await rejected([resumeFile({ type: "application/msword" })]);
        await rejected([resumeFile({ filename: "cv.pdf.exe", type: "application/octet-stream" })]);
      });

      it("must really be a PDF, not just named like one", async () => {
        await rejected([resumeFile({ content: Buffer.from("MZ this is a program") })]);
        await rejected([resumeFile({ content: Buffer.alloc(0) })]);
      });

      it("must be 5 MB or smaller, and a bigger upload is cut off while it streams", async () => {
        const body = await rejected([resumeFile({ content: Buffer.concat([pdfBytes(), Buffer.alloc(6 * MB)]) })]);
        expect(body.message).toMatch(/5 MB/);
      });

      it("must be a single file called resume", async () => {
        await rejected([resumeFile(), resumeFile({ filename: "second.pdf" })]);
        await rejected([resumeFile({ field: "attachment" })]);
      });
    });

    it("rejects a request that is not multipart, has no payload, or has a payload that is not JSON", async () => {
      const plain = await app.inject({
        method: "POST",
        url: `/api/v1/recruitment/public/jobs/${job.slug}/applications`,
        payload: payload(),
        headers: INGEST,
      });
      expect(plain.statusCode).toBe(400);
      expect((await apply(job.slug, "{ not json")).statusCode).toBe(400);

      const form = multipart({}, [resumeFile()]);
      const noPayload = await app.inject({
        method: "POST",
        url: `/api/v1/recruitment/public/jobs/${job.slug}/applications`,
        payload: form.body,
        headers: { "content-type": form.contentType, ...INGEST },
      });
      expect(noPayload.statusCode).toBe(400);
    });

    it("stores nothing and says so when the storage is down", async () => {
      const email = `down-${RUN}@test.invalid`;
      putSpy.mockRejectedValueOnce(new StorageUnavailableError());
      const response = await apply(job.slug, payload({ email, answers: answers() }));

      expect(response.statusCode).toBe(503);
      expect(response.json<ErrorBody>().code).toBe("STORAGE_UNAVAILABLE");
      expect(await row(`select 1 from recruitment.applications where email = $1`, [email])).toHaveLength(0);
    });

    it("removes the uploaded file when the database write fails", async () => {
      const email = `dbfail-${RUN}@test.invalid`;
      jest.spyOn(app.get(ApplicationsRepo), "insert").mockRejectedValueOnce(new Error("simulated database failure"));
      const before = new Set(objects.keys());

      const response = await apply(job.slug, payload({ email, answers: answers() }));

      expect(response.statusCode).toBe(500);
      expect(await row(`select 1 from recruitment.applications where email = $1`, [email])).toHaveLength(0);
      expect([...objects.keys()].filter((key) => !before.has(key))).toEqual([]);
      const lastDelete = deleteSpy.mock.calls.at(-1) as [string] | undefined;
      expect(lastDelete?.[0]).toMatch(new RegExp(`^career/${resumeFolder(job.title)}/.+\\.pdf$`));
    });

    it("rolls back the application row when the transaction fails after it was written", async () => {
      // Simulate a failure inside the transaction, after the application row was written.
      const email = `rollback-${RUN}@test.invalid`;
      const repo = app.get(ApplicationsRepo);
      // Taken before the spy is armed, so it still writes for real.
      const writeParent = repo.insert.bind(repo);
      jest.spyOn(repo, "insert").mockImplementationOnce(async (executor, application, educations) => {
        // Write the parent row, then fail: the transaction must undo it.
        await writeParent(executor, application, educations, [], []);
        throw new Error("simulated failure after the parent row");
      });
      const response = await apply(job.slug, payload({ email, answers: answers() }));

      expect(response.statusCode).toBe(500);
      expect(await row(`select 1 from recruitment.applications where email = $1`, [email])).toHaveLength(0);
    });
  });

  describe("reviewing applications in the admin", () => {
    let applicationId = "";
    const email = `review-${RUN}@test.invalid`;

    beforeAll(async () => {
      const response = await apply(
        job.slug,
        payload({
          fullName: `${marker} Zahra Review`,
          email,
          githubUrl: "https://github.com/zahra",
          educations: [education],
          experiences: [{ company: "Acme", title: "Dev", fromOn: "2021-01-01", current: true, responsibilities: "Everything" }],
          answers: [{ questionId: job.questions[0]!.id, answer: "I love design" }],
        }),
      );
      expect(response.statusCode).toBe(201);
      applicationId = response.json<{ id: string }>().id;
    });

    it("needs a session and the application permissions", async () => {
      for (const [method, url] of [
        ["GET", `/recruitment/jobs/${job.id}/applications`],
        ["GET", `/recruitment/applications/${applicationId}`],
        ["GET", `/recruitment/applications/${applicationId}/resume`],
        ["GET", "/recruitment/stats"],
      ] as const) {
        expect((await api(method, url)).statusCode).toBe(401);
        expect((await api(method, url, { cookie: jobsOnlyCookie })).statusCode).toBe(403);
      }
      expect(
        (
          await api("PATCH", `/recruitment/applications/${applicationId}`, {
            payload: { status: "hired" },
            cookie: jobsOnlyCookie,
          })
        ).statusCode,
      ).toBe(403);
    });

    it("gives the dashboard its figures: open positions, new applications and the longest-waiting ones", async () => {
      // Other test suites share this database, so check what this run added rather than absolute totals.
      const before = (await asStaff("GET", "/recruitment/stats")).json<StatsBody>();
      expect(before).toMatchObject({ closingSoonDays: 7, staleAfterDays: 3 });

      const soon = await createJob({ title: `${marker} Closing soon`, deadlineOn: dhakaDay(2) });
      const later = await createJob({ title: `${marker} Not closing`, deadlineOn: dhakaDay(30) });
      const old = await apply(soon.slug, payload({ fullName: `${marker} Waiting Long`, educations: [education] }));
      expect(old.statusCode).toBe(201);
      const oldId = old.json<{ id: string }>().id;
      await row(`update recruitment.applications set created_at = $2 where id = $1`, [oldId, "2000-01-01T00:00:00Z"]);
      expect((await apply(later.slug, payload({ educations: [education] }))).statusCode).toBe(201);

      const after = (await asStaff("GET", "/recruitment/stats")).json<StatsBody>();
      expect(after.openJobs).toBeGreaterThanOrEqual(before.openJobs + 2);
      expect(after.closingSoon).toBeGreaterThanOrEqual(before.closingSoon + 1);
      expect(after.newApplications).toBeGreaterThanOrEqual(before.newApplications + 2);
      expect(after.staleCount).toBeGreaterThanOrEqual(before.staleCount + 1);
      // The 2000-01-01 application is the oldest one in the table, so it leads the worklist
      expect(after.stale[0]).toMatchObject({
        id: oldId,
        fullName: `${marker} Waiting Long`,
        jobId: soon.id,
        jobTitle: soon.title,
      });
      expect(after.stale.length).toBeLessThanOrEqual(6);

      // A reviewed application leaves the counts
      expect((await asStaff("PATCH", `/recruitment/applications/${oldId}`, { status: "shortlisted" })).statusCode).toBe(200);
      const reviewed = (await asStaff("GET", "/recruitment/stats")).json<StatsBody>();
      expect(reviewed.stale.map((item) => item.id)).not.toContain(oldId);
      expect(reviewed.newApplications).toBeLessThan(after.newApplications + 1);

      // Only counts and a name: no email, phone or answers
      expect(JSON.stringify(after)).not.toMatch(/@test\.invalid|answer|phone/);
    });

    it("lists a job's applications with search and a status filter, and never the answers", async () => {
      const found = await asStaff("GET", `/recruitment/jobs/${job.id}/applications?q=${encodeURIComponent("Zahra Review")}`);
      expect(found.statusCode).toBe(200);
      const body = found.json<{ items: Record<string, unknown>[]; total: number }>();
      expect(body.total).toBe(1);
      expect(body.items[0]).toMatchObject({ id: applicationId, email, status: "new" });
      expect(body.items[0]).not.toHaveProperty("answers");
      expect(body.items[0]).not.toHaveProperty("resumeKey");

      const byEmail = await asStaff("GET", `/recruitment/jobs/${job.id}/applications?q=${encodeURIComponent(email)}`);
      expect(byEmail.json()).toMatchObject({ total: 1 });
      const none = await asStaff("GET", `/recruitment/jobs/${job.id}/applications?q=Zahra&status=hired`);
      expect(none.json()).toMatchObject({ total: 0, items: [] });
      const percent = await asStaff("GET", `/recruitment/jobs/${job.id}/applications?q=${encodeURIComponent("%")}`);
      expect(percent.json()).toMatchObject({ total: 0 });
    });

    it("pages the list in a stable order", async () => {
      const first = (
        await asStaff("GET", `/recruitment/jobs/${job.id}/applications?pageSize=2&page=1&sort=fullName&order=asc`)
      ).json<{ items: { id: string }[]; total: number }>();
      const second = (
        await asStaff("GET", `/recruitment/jobs/${job.id}/applications?pageSize=2&page=2&sort=fullName&order=asc`)
      ).json<{ items: { id: string }[] }>();
      expect(first.items).toHaveLength(2);
      expect(first.total).toBeGreaterThan(2);
      expect(second.items.map((item) => item.id).filter((id) => first.items.some((item) => item.id === id))).toEqual([]);
    });

    it("answers 404 for the applications of an unknown job", async () => {
      expect((await asStaff("GET", `/recruitment/jobs/${randomUUID()}/applications`)).statusCode).toBe(404);
    });

    it("shows the full application", async () => {
      const response = await asStaff("GET", `/recruitment/applications/${applicationId}`);
      expect(response.statusCode).toBe(200);
      const body = response.json<ApplicationBody>();
      expect(body).toMatchObject({
        id: applicationId,
        jobId: job.id,
        email,
        status: "new",
        notes: "",
        githubUrl: "https://github.com/zahra",
        linkedinUrl: null,
        resume: { name: "My CV.pdf" },
      });
      expect(body.resume.size).toBeGreaterThan(0);
      expect(body.educations).toEqual([
        {
          degree: "BSc",
          fieldOfStudy: "Computer Science",
          institution: "AUST",
          completedOn: "2025-11-20",
          ongoing: false,
          grade: "",
        },
      ]);
      expect(body.experiences[0]).toMatchObject({ company: "Acme", toOn: null, current: true });
      expect(body.answers).toMatchObject([{ question: "Why do you want this job?", answer: "I love design" }]);
      expect(body).not.toHaveProperty("resumeKey");
      expect((await asStaff("GET", `/recruitment/applications/${randomUUID()}`)).statusCode).toBe(404);
      expect((await asStaff("GET", "/recruitment/applications/not-a-uuid")).statusCode).toBe(400);
    });

    it("keeps the answers as asked even after the question is edited or archived", async () => {
      await asStaff("PATCH", `/recruitment/jobs/${job.id}`, {
        questions: [
          { id: job.questions[0]!.id, text: "Reworded question", required: true },
          { id: job.questions[1]!.id, text: job.questions[1]!.text, required: false },
        ],
      });
      const body = (await asStaff("GET", `/recruitment/applications/${applicationId}`)).json<ApplicationBody>();
      expect(body.answers[0]?.question).toBe("Why do you want this job?");
    });

    it("changes the status and notes, and records it without the note text", async () => {
      const response = await asStaff("PATCH", `/recruitment/applications/${applicationId}`, {
        status: "shortlisted",
        notes: "Strong portfolio, call Monday.",
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ status: "shortlisted", notes: "Strong portfolio, call Monday." });

      const rows = await row<{ actor_id: string | null; metadata: unknown }>(
        `select actor_id, metadata from core.audit_log where entity_id = $1 and action = 'recruitment.application.updated'`,
        [applicationId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.actor_id).not.toBeNull();
      expect(rows[0]?.metadata).toMatchObject({ status: "shortlisted" });
      expect(JSON.stringify(rows)).not.toContain("Strong portfolio");

      const cleared = await asStaff("PATCH", `/recruitment/applications/${applicationId}`, { notes: "" });
      expect(cleared.json()).toMatchObject({ notes: "", status: "shortlisted" });
    });

    it("rejects an empty change, an unknown status and an unknown application", async () => {
      expect((await asStaff("PATCH", `/recruitment/applications/${applicationId}`, {})).statusCode).toBe(400);
      expect((await asStaff("PATCH", `/recruitment/applications/${applicationId}`, { status: "archived" })).statusCode).toBe(400);
      expect((await asStaff("PATCH", `/recruitment/applications/${randomUUID()}`, { status: "hired" })).statusCode).toBe(404);
    });

    it("hands out a resume link that lasts five minutes, and audits each request", async () => {
      const response = await asStaff("GET", `/recruitment/applications/${applicationId}/resume`);
      expect(response.statusCode).toBe(200);
      const { url, expiresAt } = response.json<{ url: string; expiresAt: string }>();

      const link = new URL(url);
      expect(link.hostname).toBe("test-private-bucket.test-account.r2.cloudflarestorage.com");
      const [stored] = await row<{ resume_key: string }>(`select resume_key from recruitment.applications where id = $1`, [
        applicationId,
      ]);
      const storedKey = stored?.resume_key ?? "";
      expect(decodeURIComponent(link.pathname)).toBe(`/${storedKey}`);
      expect(link.searchParams.get("X-Amz-Expires")).toBe("300");
      const seconds = (new Date(expiresAt).getTime() - Date.now()) / 1000;
      expect(seconds).toBeGreaterThan(280);
      expect(seconds).toBeLessThanOrEqual(300);

      await asStaff("GET", `/recruitment/applications/${applicationId}/resume`);
      const audit = await row<{ metadata: unknown }>(
        `select metadata from core.audit_log where entity_id = $1 and action = 'recruitment.application.resume_viewed'`,
        [applicationId],
      );
      expect(audit).toHaveLength(2);
      expect(JSON.stringify(audit)).not.toContain("X-Amz");
    });

    it("answers 404 when the file is missing from storage or the application is unknown", async () => {
      const [stored] = await row<{ resume_key: string }>(`select resume_key from recruitment.applications where id = $1`, [
        applicationId,
      ]);
      const storedKey = stored?.resume_key ?? "";
      objects.delete(storedKey);
      expect((await asStaff("GET", `/recruitment/applications/${applicationId}/resume`)).statusCode).toBe(404);
      expect((await asStaff("GET", `/recruitment/applications/${randomUUID()}/resume`)).statusCode).toBe(404);
    });

    it("counts applications on the job list and the job page", async () => {
      const list = await asStaff("GET", `/recruitment/jobs?q=${encodeURIComponent(`${marker} Designer`)}`);
      const listed = list.json<{ items: (JobBody & { id: string })[] }>().items.find((item) => item.id === job.id);
      expect(listed?.applicationCount).toBeGreaterThanOrEqual(3);
      expect(listed?.newApplicationCount).toBeGreaterThanOrEqual(1);
      expect(listed!.newApplicationCount).toBeLessThan(listed!.applicationCount); // one was shortlisted above

      const detail = (await asStaff("GET", `/recruitment/jobs/${job.id}`)).json<JobBody>();
      expect(detail.applicationCount).toBe(listed?.applicationCount);

      const empty = await createJob({ title: `${marker} Nobody applied` });
      expect(empty).toMatchObject({ applicationCount: 0, newApplicationCount: 0 });
    });
  });
});
