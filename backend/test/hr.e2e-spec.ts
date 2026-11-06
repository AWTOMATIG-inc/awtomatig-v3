import { randomUUID } from "node:crypto";

import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { createApp } from "../src/bootstrap";
import { addDays, dhakaToday } from "../src/modules/hr/domain/employment-period";
import { users } from "../src/shared/auth/auth.schema";
import { rolePermissions, roles, userRoles } from "../src/shared/rbac/rbac.schema";

// The HR endpoints against a real, migrated PostgreSQL (backend/RULES.md section 6). It creates its own users, roles, departments
// and employees and removes them afterwards. Skipped unless TEST_DATABASE_URL is set:
//   TEST_DATABASE_URL=postgres://… npm test -- hr.e2e
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDb = databaseUrl ? describe : describe.skip;

const PASSWORD = "correct horse battery staple";
const ORIGIN = "http://localhost:3001";
const RUN = randomUUID().slice(0, 8);
const NID_PREFIX = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

const TODAY = dhakaToday();
const ago = (days: number) => addDays(TODAY, -days);
const ahead = (days: number) => addDays(TODAY, days);

interface Block {
  id: string;
  effectiveFrom: string;
  endsOn: string | null;
  status: string;
  reason: string;
  note: string | null;
  period: { years: number; months: number; days: number; totalDays: number } | null;
  designation: string;
  employmentType: string;
  workMode: string;
  salary?: string | null;
  department: { id: string; name: string } | null;
  manager: { id: string; employeeId: string; fullName: string } | null;
  changes: { field: string; from: string | null; to: string | null }[];
  recordedBy: string | null;
}

interface Employee {
  id: string;
  employeeNo: number;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  joinedOn: string;
  leftOn: string | null;
  designation: string;
  employmentType: string;
  workMode: string;
  department: { id: string; name: string } | null;
  manager: { id: string; employeeId: string; fullName: string } | null;
  period: { years: number; months: number; days: number; totalDays: number };
  address: string;
  nid: string;
  nidMasked: boolean;
  salary?: string | null;
  exitType: string | null;
  exitNote: string | null;
  directReports: { id: string; employeeId: string; fullName: string; designation: string }[];
  timeline: Block[];
}

interface ListBody {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

interface DepartmentBody {
  id: string;
  name: string;
  description: string;
  active: boolean;
  employeeCount: number;
}

describeWithDb("HR employees and timeline (real PostgreSQL)", () => {
  let app: NestFastifyApplication;
  let pool: Pool;
  const emails = {
    admin: `e2e-hr-admin-${RUN}@test.invalid`,
    lite: `e2e-hr-lite-${RUN}@test.invalid`,
    reader: `e2e-hr-reader-${RUN}@test.invalid`,
    guest: `e2e-hr-guest-${RUN}@test.invalid`,
  };
  const roleNames = [`e2e-hr-admin-${RUN}`, `e2e-hr-lite-${RUN}`, `e2e-hr-read-${RUN}`, `e2e-hr-none-${RUN}`];
  const marker = `E2E ${RUN}`;
  const cookies = { admin: "", lite: "", reader: "", guest: "" };
  let adminId = "";

  let sequence = 0;
  const person = (patch: Record<string, unknown> = {}) => {
    const n = sequence++;
    return {
      fullName: `${marker} Person ${n}`,
      email: `e2e-hr-${RUN}-${n}@test.invalid`,
      phone: "+880 1712-345678",
      address: "House 1, Road 2, Dhaka",
      nid: `${NID_PREFIX}${String(n).padStart(7, "0")}`,
      joinedOn: ago(200),
      designation: "Marketing Intern",
      employmentType: "internship",
      workMode: "onsite",
      ...patch,
    };
  };

  type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  type Who = keyof typeof cookies | "none";
  const api = (who: Who, method: Method, url: string, payload?: object) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      payload,
      headers: who === "none" ? {} : { cookie: cookies[who] },
    });

  async function hire(patch: Record<string, unknown> = {}, who: Who = "admin"): Promise<Employee> {
    const response = await api(who, "POST", "/hr/employees", person(patch));
    expect(response.json()).toMatchObject({});
    expect(response.statusCode).toBe(201);
    return response.json<Employee>();
  }

  async function change(id: string, payload: Record<string, unknown>, who: Who = "admin"): Promise<Employee> {
    const response = await api(who, "POST", `/hr/employees/${id}/employment-changes`, payload);
    expect(response.statusCode).toBe(201);
    return response.json<Employee>();
  }

  const details = (response: { json: <T>() => T }) => response.json<{ details: Record<string, unknown> }>().details;
  const profile = async (id: string, who: Who = "admin") => (await api(who, "GET", `/hr/employees/${id}`)).json<Employee>();

  async function department(name = `${marker} Dept ${sequence++}`): Promise<DepartmentBody> {
    const response = await api("admin", "POST", "/hr/departments", { name, description: "Test department" });
    expect(response.statusCode).toBe(201);
    return response.json<DepartmentBody>();
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
      if (permissions.length > 0)
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
      "hr.department.read",
      "hr.department.manage",
    ]);
    // HR staff who may do the work but not see salaries or NIDs, delete people or manage departments.
    await makeUser(emails.lite, roleNames[1]!, [
      "hr.employee.read",
      "hr.employee.create",
      "hr.employee.update",
      "hr.department.read",
    ]);
    await makeUser(emails.reader, roleNames[2]!, ["hr.employee.read"]);
    await makeUser(emails.guest, roleNames[3]!, ["cms.faq.read", "crm.lead.read", "recruitment.job.read"]);

    app = await createApp();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    cookies.admin = await signIn(emails.admin);
    cookies.lite = await signIn(emails.lite);
    cookies.reader = await signIn(emails.reader);
    cookies.guest = await signIn(emails.guest);
  });

  afterAll(async () => {
    await app?.close();
    const db = drizzle({ client: pool });
    // Only this run's rows: other suites share the database. Records go first because they point at employees and departments.
    await pool.query(
      `delete from hr.employment_records where employee_id in (select id from hr.employees where full_name like $1)`,
      [`${marker}%`],
    );
    await pool.query(`delete from hr.employees where full_name like $1`, [`${marker}%`]);
    await pool.query(`delete from hr.departments where name like $1`, [`${marker}%`]);
    await pool.query(
      `delete from core.audit_log where action like 'hr.%' and actor_id in (select id from core.users where email like $1)`,
      [`e2e-hr-%-${RUN}@test.invalid`],
    );
    await db.delete(users).where(like(users.email, `e2e-hr-%-${RUN}@test.invalid`));
    for (const name of roleNames) await db.delete(roles).where(eq(roles.name, name));
    await pool.end();
  });

  describe("access", () => {
    it("needs a session", async () => {
      const id = randomUUID();
      for (const [method, url] of [
        ["GET", "/hr/employees"],
        ["POST", "/hr/employees"],
        ["GET", `/hr/employees/${id}`],
        ["PATCH", `/hr/employees/${id}`],
        ["POST", `/hr/employees/${id}/employment-changes`],
        ["DELETE", `/hr/employees/${id}/employment-changes/${id}`],
        ["POST", `/hr/employees/${id}/leave`],
        ["POST", `/hr/employees/${id}/reinstate`],
        ["DELETE", `/hr/employees/${id}`],
        ["GET", "/hr/designations"],
        ["GET", "/hr/departments"],
        ["POST", "/hr/departments"],
        ["PATCH", `/hr/departments/${id}`],
        ["POST", `/hr/departments/${id}/deactivate`],
      ] as [Method, string][])
        expect((await api("none", method, url, {})).statusCode).toBe(401);
    });

    it("refuses an employee without HR permissions, even one who has other modules", async () => {
      const id = randomUUID();
      for (const [method, url] of [
        ["GET", "/hr/employees"],
        ["POST", "/hr/employees"],
        ["GET", `/hr/employees/${id}`],
        ["PATCH", `/hr/employees/${id}`],
        ["POST", `/hr/employees/${id}/employment-changes`],
        ["POST", `/hr/employees/${id}/leave`],
        ["DELETE", `/hr/employees/${id}`],
        ["GET", "/hr/designations"],
        ["GET", "/hr/departments"],
        ["POST", "/hr/departments"],
      ] as [Method, string][])
        expect((await api("guest", method, url, {})).statusCode).toBe(403);
    });

    it("lets a reader read but not change anything", async () => {
      const employee = await hire();
      expect((await api("reader", "GET", "/hr/employees")).statusCode).toBe(200);
      expect((await api("reader", "GET", `/hr/employees/${employee.id}`)).statusCode).toBe(200);
      expect((await api("reader", "POST", "/hr/employees", person())).statusCode).toBe(403);
      expect((await api("reader", "PATCH", `/hr/employees/${employee.id}`, { phone: "01712345678" })).statusCode).toBe(403);
      expect(
        (
          await api("reader", "POST", `/hr/employees/${employee.id}/employment-changes`, {
            effectiveFrom: ago(1),
            workMode: "remote",
          })
        ).statusCode,
      ).toBe(403);
      expect(
        (await api("reader", "POST", `/hr/employees/${employee.id}/leave`, { leftOn: ago(1), exitType: "resigned" })).statusCode,
      ).toBe(403);
      // The department list needs its own permission.
      expect((await api("reader", "GET", "/hr/departments")).statusCode).toBe(403);
    });

    it("keeps delete, department management and salaries separate from ordinary HR work", async () => {
      const employee = await hire();
      expect((await api("lite", "DELETE", `/hr/employees/${employee.id}`)).statusCode).toBe(403);
      expect((await api("lite", "POST", "/hr/departments", { name: `${marker} Nope` })).statusCode).toBe(403);
      expect((await api("lite", "GET", "/hr/departments")).statusCode).toBe(200);
      expect((await api("admin", "DELETE", `/hr/employees/${employee.id}`)).statusCode).toBe(204);
    });
  });

  describe("create", () => {
    it("saves the person with an EMP ID and a Joined entry", async () => {
      const first = await hire({ salary: "15000" });
      const second = await hire();

      expect(first.employeeId).toBe(`EMP-${String(first.employeeNo).padStart(4, "0")}`);
      expect(second.employeeNo).toBeGreaterThan(first.employeeNo);
      expect(first).toMatchObject({
        status: "active",
        designation: "Marketing Intern",
        employmentType: "internship",
        workMode: "onsite",
        salary: "15000",
        nidMasked: false,
        leftOn: null,
        directReports: [],
      });
      expect(first.timeline).toHaveLength(1);
      expect(first.timeline[0]).toMatchObject({
        reason: "joined",
        status: "current",
        endsOn: null,
        changes: [],
        effectiveFrom: ago(200),
      });
      expect(first.period.totalDays).toBe(200);
    });

    it("lower-cases the email, trims text and ignores an id, EMP ID or status sent by the client", async () => {
      const id = randomUUID();
      const created = await hire({
        email: `E2E-HR-${RUN}-UPPER@Test.Invalid `,
        fullName: `${marker}   Padded  `,
        id,
        employeeId: "EMP-9999",
        status: "left",
      });
      expect(created.email).toBe(`e2e-hr-${RUN}-upper@test.invalid`);
      expect(created.fullName).toBe(`${marker}   Padded`);
      expect(created.id).not.toBe(id);
      expect(created.employeeId).not.toBe("EMP-9999");
      expect(created.status).toBe("active");
    });

    it("refuses a second employee with the same email (any case) or the same NID", async () => {
      const original = await hire();
      const sameEmail = await api("admin", "POST", "/hr/employees", person({ email: original.email.toUpperCase() }));
      expect(sameEmail.statusCode).toBe(409);
      expect(details(sameEmail).email).toBeDefined();
      const sameNid = await api("admin", "POST", "/hr/employees", person({ nid: original.nid }));
      expect(sameNid.statusCode).toBe(409);
      expect(details(sameNid).nid).toBeDefined();
    });

    it("refuses bad input", async () => {
      for (const patch of [
        { nid: "12345" },
        { nid: "1234567890a" },
        { email: "nope" },
        { fullName: "J" },
        { phone: "abc" },
        { employmentType: "freelance" },
        { workMode: "hybried" },
        { joinedOn: "2026-02-30" },
        { designation: "x" },
        { salary: "-5" },
        { salary: "1.234" },
        { departmentId: "not-an-id" },
      ])
        expect((await api("admin", "POST", "/hr/employees", person(patch))).statusCode).toBe(400);
    });

    it("accepts a joining date in the future as upcoming", async () => {
      const upcoming = await hire({ joinedOn: ahead(30) });
      expect(upcoming.status).toBe("upcoming");
      expect(upcoming.designation).toBe("Marketing Intern");
      expect(upcoming.period.totalDays).toBe(0);
      expect(upcoming.timeline[0]!.status).toBe("scheduled");
    });

    it("sets department and manager, and refuses an unknown or inactive department and an unknown manager", async () => {
      const dept = await department();
      const boss = await hire({ designation: "Head of Marketing", employmentType: "full_time" });
      const created = await hire({ departmentId: dept.id, managerId: boss.id });
      expect(created.department).toEqual({ id: dept.id, name: dept.name });
      expect(created.manager).toEqual({ id: boss.id, employeeId: boss.employeeId, fullName: boss.fullName });

      expect((await api("admin", "POST", "/hr/employees", person({ departmentId: randomUUID() }))).statusCode).toBe(400);
      expect((await api("admin", "POST", "/hr/employees", person({ managerId: randomUUID() }))).statusCode).toBe(400);
      await api("admin", "POST", `/hr/departments/${dept.id}/deactivate`);
      expect((await api("admin", "POST", "/hr/employees", person({ departmentId: dept.id }))).statusCode).toBe(400);
    });
  });

  describe("the career timeline", () => {
    it("records Intern, then Full Time, then Marketing Executive with a raise, and keeps current in step", async () => {
      const dept = await department();
      const hired = await hire({ salary: "15000", departmentId: dept.id });

      const fullTime = await change(hired.id, {
        effectiveFrom: ago(110),
        employmentType: "full_time",
        note: "Confirmed after review",
      });
      expect(fullTime.employmentType).toBe("full_time");
      expect(fullTime.designation).toBe("Marketing Intern");
      expect(fullTime.salary).toBe("15000");
      expect(fullTime.department).toEqual({ id: dept.id, name: dept.name });
      expect(fullTime.timeline[0]).toMatchObject({
        reason: "role_type_change",
        note: "Confirmed after review",
        status: "current",
        endsOn: null,
      });
      expect(fullTime.timeline[0]!.changes).toEqual([{ field: "employmentType", from: "internship", to: "full_time" }]);
      expect(fullTime.timeline[1]).toMatchObject({ reason: "joined", status: "past", endsOn: ago(111) });
      expect(fullTime.timeline[1]!.period!.totalDays).toBe(90);

      const executive = await change(hired.id, { effectiveFrom: ago(20), designation: "Marketing Executive", salary: "25000" });
      expect(executive).toMatchObject({ designation: "Marketing Executive", employmentType: "full_time", salary: "25000" });
      expect(executive.timeline.map((block) => block.reason)).toEqual(["promotion", "role_type_change", "joined"]);
      expect(executive.timeline[0]!.changes).toEqual([
        { field: "designation", from: "Marketing Intern", to: "Marketing Executive" },
        { field: "salary", from: "15000", to: "25000" },
      ]);
      expect(executive.timeline[0]!.recordedBy).toBe(`E2E ${emails.admin}`);
      expect(executive.period.totalDays).toBe(200);

      // The list reads the same current values.
      const listed = (await api("admin", "GET", `/hr/employees?q=${executive.employeeId}`)).json<ListBody>();
      expect(listed.items).toHaveLength(1);
      expect(listed.items[0]).toMatchObject({ designation: "Marketing Executive", employmentType: "full_time" });
    });

    it("uses the reason that was chosen, or works one out", async () => {
      const hired = await hire();
      const raise = await change(hired.id, { effectiveFrom: ago(100), salary: "20000" });
      expect(raise.timeline[0]!.reason).toBe("salary_revision");
      const chosen = await change(hired.id, {
        effectiveFrom: ago(90),
        designation: "Marketing Intern II",
        reason: "designation_change",
      });
      expect(chosen.timeline[0]!.reason).toBe("designation_change");
      const mode = await change(hired.id, { effectiveFrom: ago(80), workMode: "remote" });
      expect(mode.timeline[0]!.reason).toBe("work_mode_change");
      expect(
        (
          await api("admin", "POST", `/hr/employees/${hired.id}/employment-changes`, {
            effectiveFrom: ago(70),
            workMode: "hybrid",
            reason: "joined",
          })
        ).statusCode,
      ).toBe(400);
    });

    it("carries unchanged fields forward from the stint before the effective date", async () => {
      const hired = await hire({ salary: "15000" });
      const first = await change(hired.id, { effectiveFrom: ago(100), designation: "Marketing Executive" });
      expect(first.salary).toBe("15000");
      expect(first.timeline[0]!.changes.map((c) => c.field)).toEqual(["designation"]);
    });

    it("lets past history be filled in without changing the present, and falls back when the newest entry is removed", async () => {
      const hired = await hire({ salary: "15000" });
      const latest = await change(hired.id, {
        effectiveFrom: ago(30),
        designation: "Marketing Executive",
        employmentType: "full_time",
      });

      const withPast = await change(hired.id, { effectiveFrom: ago(150), workMode: "hybrid" });
      expect(withPast.designation).toBe("Marketing Executive");
      expect(withPast.workMode).toBe("onsite");
      expect(withPast.timeline.map((block) => block.effectiveFrom)).toEqual([ago(30), ago(150), ago(200)]);

      const removed = await api("admin", "DELETE", `/hr/employees/${hired.id}/employment-changes/${latest.timeline[0]!.id}`);
      expect(removed.statusCode).toBe(200);
      const after = removed.json<Employee>();
      expect(after.designation).toBe("Marketing Intern");
      expect(after.workMode).toBe("hybrid");
      expect(after.timeline).toHaveLength(2);
    });

    it("schedules a future change: it shows as scheduled and does not touch the present", async () => {
      const hired = await hire({ employmentType: "full_time" });
      const scheduled = await change(hired.id, { effectiveFrom: ahead(30), designation: "Senior Marketer", salary: "40000" });

      expect(scheduled.designation).toBe("Marketing Intern");
      expect(scheduled.salary).toBeNull();
      expect(scheduled.timeline[0]).toMatchObject({
        status: "scheduled",
        period: null,
        salary: "40000",
        designation: "Senior Marketer",
      });
      expect(scheduled.timeline[1]).toMatchObject({ status: "current", endsOn: ahead(29) });
      const listed = (await api("admin", "GET", `/hr/employees?q=${hired.employeeId}`)).json<ListBody>();
      expect(listed.items[0]!.designation).toBe("Marketing Intern");
    });

    it("refuses a change with no differences, on the same date as another, or outside the employment dates", async () => {
      const hired = await hire({ salary: "15000" });
      await change(hired.id, { effectiveFrom: ago(100), workMode: "remote" });

      const same = await api("admin", "POST", `/hr/employees/${hired.id}/employment-changes`, {
        effectiveFrom: ago(100),
        designation: "Other",
      });
      expect(same.statusCode).toBe(409);
      const nothing = await api("admin", "POST", `/hr/employees/${hired.id}/employment-changes`, {
        effectiveFrom: ago(50),
        workMode: "remote",
        salary: "15000.00",
      });
      expect(nothing.statusCode).toBe(400);
      const early = await api("admin", "POST", `/hr/employees/${hired.id}/employment-changes`, {
        effectiveFrom: ago(201),
        workMode: "hybrid",
      });
      expect(early.statusCode).toBe(400);
      expect(details(early).effectiveFrom).toBeDefined();
      const onJoining = await api("admin", "POST", `/hr/employees/${hired.id}/employment-changes`, {
        effectiveFrom: ago(200),
        workMode: "hybrid",
      });
      expect(onJoining.statusCode).toBe(409);
      expect(
        (
          await api("admin", "POST", `/hr/employees/${hired.id}/employment-changes`, {
            effectiveFrom: "2026-02-30",
            workMode: "hybrid",
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (await api("admin", "POST", `/hr/employees/${hired.id}/employment-changes`, { workMode: "hybrid" })).statusCode,
      ).toBe(400);
      expect(
        (
          await api("admin", "POST", `/hr/employees/${randomUUID()}/employment-changes`, {
            effectiveFrom: ago(1),
            workMode: "hybrid",
          })
        ).statusCode,
      ).toBe(404);
    });

    it("never removes the Joined entry, and never another employee's entry", async () => {
      const a = await hire();
      const b = await hire();
      const bChanged = await change(b.id, { effectiveFrom: ago(10), workMode: "remote" });

      expect((await api("admin", "DELETE", `/hr/employees/${a.id}/employment-changes/${a.timeline[0]!.id}`)).statusCode).toBe(
        409,
      );
      expect(
        (await api("admin", "DELETE", `/hr/employees/${a.id}/employment-changes/${bChanged.timeline[0]!.id}`)).statusCode,
      ).toBe(404);
      expect((await api("admin", "DELETE", `/hr/employees/${a.id}/employment-changes/${randomUUID()}`)).statusCode).toBe(404);
    });
  });

  describe("departments and managers", () => {
    it("records a transfer and a manager change as dated entries", async () => {
      const sales = await department();
      const marketing = await department();
      const boss = await hire({ employmentType: "full_time" });
      const hired = await hire({ departmentId: sales.id });

      const moved = await change(hired.id, { effectiveFrom: ago(60), departmentId: marketing.id });
      expect(moved.timeline[0]).toMatchObject({ reason: "department_transfer" });
      expect(moved.timeline[0]!.changes).toEqual([{ field: "departmentId", from: sales.name, to: marketing.name }]);

      const managed = await change(hired.id, { effectiveFrom: ago(30), managerId: boss.id });
      expect(managed.timeline[0]).toMatchObject({ reason: "manager_change" });
      expect(managed.timeline[0]!.changes).toEqual([{ field: "managerId", from: null, to: boss.fullName }]);
      expect(managed.manager).toMatchObject({ id: boss.id });
      expect((await profile(boss.id)).directReports.map((report) => report.id)).toEqual([hired.id]);

      const cleared = await change(hired.id, { effectiveFrom: ago(10), managerId: null });
      expect(cleared.manager).toBeNull();
      expect((await profile(boss.id)).directReports).toEqual([]);
    });

    it("refuses a manager who is the employee, does not exist, had not joined, or had left", async () => {
      const hired = await hire();
      const late = await hire({ joinedOn: ago(10) });
      const gone = await hire({ employmentType: "full_time" });
      expect(
        (await api("admin", "POST", `/hr/employees/${gone.id}/leave`, { leftOn: ago(50), exitType: "resigned" })).statusCode,
      ).toBe(200);

      const attempt = (managerId: string, effectiveFrom: string) =>
        api("admin", "POST", `/hr/employees/${hired.id}/employment-changes`, { effectiveFrom, managerId });
      expect((await attempt(hired.id, ago(5))).statusCode).toBe(400);
      expect((await attempt(randomUUID(), ago(5))).statusCode).toBe(400);
      expect((await attempt(late.id, ago(20))).statusCode).toBe(400);
      expect((await attempt(gone.id, ago(5))).statusCode).toBe(400);
      // Dated before they left, the same person is fine.
      expect((await attempt(gone.id, ago(60))).statusCode).toBe(201);
    });

    it("refuses a reporting loop", async () => {
      const a = await hire();
      const b = await hire();
      const c = await hire();
      await change(a.id, { effectiveFrom: ago(20), managerId: b.id });
      await change(b.id, { effectiveFrom: ago(20), managerId: c.id });

      const loop = await api("admin", "POST", `/hr/employees/${c.id}/employment-changes`, {
        effectiveFrom: ago(10),
        managerId: a.id,
      });
      expect(loop.statusCode).toBe(400);
      expect(details(loop).managerId).toMatch(/loop/);
      expect(
        (await api("admin", "POST", `/hr/employees/${b.id}/employment-changes`, { effectiveFrom: ago(10), managerId: a.id }))
          .statusCode,
      ).toBe(400);
    });

    it("refuses a deactivated department for a new assignment but lets people already in it keep it", async () => {
      const dept = await department();
      const hired = await hire({ departmentId: dept.id });
      const other = await hire();

      const deactivated = await api("admin", "POST", `/hr/departments/${dept.id}/deactivate`);
      expect(deactivated.statusCode).toBe(200);
      expect(deactivated.json<DepartmentBody>()).toMatchObject({ active: false, employeeCount: 1 });
      expect(
        (
          await api("admin", "POST", `/hr/employees/${other.id}/employment-changes`, {
            effectiveFrom: ago(5),
            departmentId: dept.id,
          })
        ).statusCode,
      ).toBe(400);
      // An unrelated change for someone in the deactivated department is not blocked by it.
      const raise = await change(hired.id, { effectiveFrom: ago(5), salary: "30000" });
      expect(raise.department).toEqual({ id: dept.id, name: dept.name });
      expect((await profile(hired.id)).department?.id).toBe(dept.id);
    });

    it("manages departments: unique names in any case, edit, activate and deactivate", async () => {
      const dept = await department(`${marker} Ops ${sequence++}`);
      expect((await api("admin", "POST", "/hr/departments", { name: dept.name.toUpperCase() })).statusCode).toBe(409);
      expect((await api("admin", "POST", "/hr/departments", { name: "x" })).statusCode).toBe(400);

      const renamed = await api("admin", "PATCH", `/hr/departments/${dept.id}`, { description: "Runs the office" });
      expect(renamed.json<DepartmentBody>()).toMatchObject({ name: dept.name, description: "Runs the office" });
      const clash = await department();
      expect((await api("admin", "PATCH", `/hr/departments/${clash.id}`, { name: dept.name })).statusCode).toBe(409);
      expect((await api("admin", "PATCH", `/hr/departments/${dept.id}`, {})).statusCode).toBe(400);
      expect((await api("admin", "PATCH", `/hr/departments/${randomUUID()}`, { name: "Ghost department" })).statusCode).toBe(404);

      expect((await api("admin", "POST", `/hr/departments/${dept.id}/activate`)).statusCode).toBe(409);
      expect((await api("admin", "POST", `/hr/departments/${dept.id}/deactivate`)).statusCode).toBe(200);
      expect((await api("admin", "POST", `/hr/departments/${dept.id}/deactivate`)).statusCode).toBe(409);
      const onlyActive = (await api("admin", "GET", "/hr/departments?active=true")).json<{ items: DepartmentBody[] }>();
      expect(onlyActive.items.map((item) => item.id)).not.toContain(dept.id);
      const all = (await api("admin", "GET", "/hr/departments")).json<{ items: DepartmentBody[] }>();
      expect(all.items.map((item) => item.id)).toContain(dept.id);
      expect((await api("admin", "POST", `/hr/departments/${dept.id}/activate`)).statusCode).toBe(200);
    });

    it("counts only people still with the company", async () => {
      const dept = await department();
      const stays = await hire({ departmentId: dept.id });
      const leaves = await hire({ departmentId: dept.id });
      expect(stays.id).not.toBe(leaves.id);
      await api("admin", "POST", `/hr/employees/${leaves.id}/leave`, { leftOn: ago(1), exitType: "resigned" });
      const counted = (await api("admin", "GET", `/hr/departments/${dept.id}`)).json<DepartmentBody>();
      expect(counted.employeeCount).toBe(1);
    });
  });

  describe("personal details", () => {
    it("edits personal details and ignores employment fields", async () => {
      const hired = await hire({ salary: "15000" });
      const response = await api("admin", "PATCH", `/hr/employees/${hired.id}`, {
        phone: "01712345678",
        address: "New address",
        designation: "CEO",
        salary: "999999",
      });
      expect(response.statusCode).toBe(200);
      const updated = response.json<Employee>();
      expect(updated).toMatchObject({
        phone: "01712345678",
        address: "New address",
        designation: "Marketing Intern",
        salary: "15000",
      });
      expect(updated.timeline).toHaveLength(1);
      expect((await api("admin", "PATCH", `/hr/employees/${hired.id}`, {})).statusCode).toBe(400);
      expect((await api("admin", "PATCH", `/hr/employees/${randomUUID()}`, { phone: "01712345678" })).statusCode).toBe(404);
    });

    it("refuses an email or NID that belongs to someone else, but not to the same person", async () => {
      const a = await hire();
      const b = await hire();
      expect((await api("admin", "PATCH", `/hr/employees/${b.id}`, { email: a.email.toUpperCase() })).statusCode).toBe(409);
      expect((await api("admin", "PATCH", `/hr/employees/${b.id}`, { nid: a.nid })).statusCode).toBe(409);
      expect(
        (await api("admin", "PATCH", `/hr/employees/${b.id}`, { email: b.email.toUpperCase(), nid: b.nid })).statusCode,
      ).toBe(200);
    });

    it("moves the joining date with the Joined entry, but not past the first change", async () => {
      const hired = await hire();
      await change(hired.id, { effectiveFrom: ago(100), workMode: "remote" });

      expect((await api("admin", "PATCH", `/hr/employees/${hired.id}`, { joinedOn: ago(100) })).statusCode).toBe(400);
      expect((await api("admin", "PATCH", `/hr/employees/${hired.id}`, { joinedOn: ago(50) })).statusCode).toBe(400);
      const moved = (await api("admin", "PATCH", `/hr/employees/${hired.id}`, { joinedOn: ago(300) })).json<Employee>();
      expect(moved.joinedOn).toBe(ago(300));
      expect(moved.timeline.at(-1)!.effectiveFrom).toBe(ago(300));
      expect(moved.period.totalDays).toBe(300);
    });
  });

  describe("leaving", () => {
    it("marks someone as left: the period stops, the list hides them by default, and no change can follow", async () => {
      const hired = await hire();
      const left = await api("admin", "POST", `/hr/employees/${hired.id}/leave`, {
        leftOn: ago(10),
        exitType: "resigned",
        exitNote: "Moving abroad",
      });
      expect(left.statusCode).toBe(200);
      const body = left.json<Employee>();
      expect(body).toMatchObject({ status: "left", leftOn: ago(10), exitType: "resigned", exitNote: "Moving abroad" });
      expect(body.period.totalDays).toBe(191);
      expect(body.timeline[0]).toMatchObject({ status: "current", endsOn: ago(10) });
      expect(body.timeline[0]!.period!.totalDays).toBe(191);

      const working = (await api("admin", "GET", `/hr/employees?q=${hired.employeeId}`)).json<ListBody>();
      expect(working.total).toBe(0);
      const leftList = (await api("admin", "GET", `/hr/employees?q=${hired.employeeId}&status=left`)).json<ListBody>();
      expect(leftList.items.map((item) => item.id)).toEqual([hired.id]);
      const all = (await api("admin", "GET", `/hr/employees?q=${hired.employeeId}&status=all`)).json<ListBody>();
      expect(all.total).toBe(1);

      const late = await api("admin", "POST", `/hr/employees/${hired.id}/employment-changes`, {
        effectiveFrom: ago(5),
        workMode: "remote",
      });
      expect(late.statusCode).toBe(400);
      expect(details(late).effectiveFrom).toMatch(/leaving date/);
      expect(
        (await api("admin", "POST", `/hr/employees/${hired.id}/leave`, { leftOn: ago(5), exitType: "resigned" })).statusCode,
      ).toBe(409);
    });

    it("treats a leaving date still ahead as serving notice, counted to today", async () => {
      const hired = await hire();
      const notice = (
        await api("admin", "POST", `/hr/employees/${hired.id}/leave`, { leftOn: ahead(20), exitType: "contract_ended" })
      ).json<Employee>();
      expect(notice.status).toBe("leaving");
      expect(notice.period.totalDays).toBe(200);
      expect(notice.timeline[0]!.endsOn).toBe(ahead(20));
      const working = (await api("admin", "GET", `/hr/employees?q=${hired.employeeId}`)).json<ListBody>();
      expect(working.total).toBe(1);
    });

    it("refuses a leaving date before joining or before an existing change", async () => {
      const hired = await hire();
      await change(hired.id, { effectiveFrom: ago(50), workMode: "remote" });
      expect(
        (await api("admin", "POST", `/hr/employees/${hired.id}/leave`, { leftOn: ago(201), exitType: "resigned" })).statusCode,
      ).toBe(400);
      const early = await api("admin", "POST", `/hr/employees/${hired.id}/leave`, { leftOn: ago(60), exitType: "resigned" });
      expect(early.statusCode).toBe(400);
      expect(
        (await api("admin", "POST", `/hr/employees/${hired.id}/leave`, { leftOn: ago(60), exitType: "fired" })).statusCode,
      ).toBe(400);
      expect(
        (await api("admin", "POST", `/hr/employees/${randomUUID()}/leave`, { leftOn: ago(1), exitType: "resigned" })).statusCode,
      ).toBe(404);
    });

    it("reinstates someone marked as left by mistake", async () => {
      const hired = await hire();
      expect((await api("admin", "POST", `/hr/employees/${hired.id}/reinstate`)).statusCode).toBe(409);
      await api("admin", "POST", `/hr/employees/${hired.id}/leave`, { leftOn: ago(10), exitType: "terminated", exitNote: "x" });
      const back = (await api("admin", "POST", `/hr/employees/${hired.id}/reinstate`)).json<Employee>();
      expect(back).toMatchObject({ status: "active", leftOn: null, exitType: null, exitNote: null });
      expect(back.period.totalDays).toBe(200);
    });

    it("will not let a manager go until their direct reports are handed over", async () => {
      const boss = await hire({ employmentType: "full_time" });
      const successor = await hire({ employmentType: "full_time" });
      const one = await hire({ managerId: boss.id });
      const two = await hire({ managerId: boss.id });
      expect((await profile(boss.id)).directReports).toHaveLength(2);

      const blocked = await api("admin", "POST", `/hr/employees/${boss.id}/leave`, { leftOn: ago(1), exitType: "resigned" });
      expect(blocked.statusCode).toBe(409);
      expect(details(blocked).directReports).toBe(2);
      expect((await profile(boss.id)).leftOn).toBeNull();

      const handed = await api("admin", "POST", `/hr/employees/${boss.id}/leave`, {
        leftOn: ago(1),
        exitType: "resigned",
        reassignReportsTo: successor.id,
      });
      expect(handed.statusCode).toBe(200);
      for (const report of [one, two]) {
        const after = await profile(report.id);
        expect(after.manager).toMatchObject({ id: successor.id });
        expect(after.timeline[0]).toMatchObject({
          reason: "manager_change",
          effectiveFrom: ago(1),
          note: "Manager left the company",
        });
      }
      expect((await profile(successor.id)).directReports.map((report) => report.id).sort()).toEqual([one.id, two.id].sort());
      expect((await profile(boss.id)).directReports).toEqual([]);
    });

    it("can hand reports to nobody, and refuses a successor who is the leaver or has already left", async () => {
      const boss = await hire({ employmentType: "full_time" });
      const gone = await hire({ employmentType: "full_time" });
      await api("admin", "POST", `/hr/employees/${gone.id}/leave`, { leftOn: ago(30), exitType: "resigned" });
      const report = await hire({ managerId: boss.id });

      const body = (leaveOn: string, reassignReportsTo: string | null) => ({
        leftOn: leaveOn,
        exitType: "resigned",
        reassignReportsTo,
      });
      expect((await api("admin", "POST", `/hr/employees/${boss.id}/leave`, body(ago(1), boss.id))).statusCode).toBe(400);
      expect((await api("admin", "POST", `/hr/employees/${boss.id}/leave`, body(ago(1), gone.id))).statusCode).toBe(400);
      expect((await api("admin", "POST", `/hr/employees/${boss.id}/leave`, body(ago(1), null))).statusCode).toBe(200);
      expect((await profile(report.id)).manager).toBeNull();
    });

    it("refuses a handover that collides with a change already on or after the leaving date", async () => {
      const boss = await hire({ employmentType: "full_time" });
      const report = await hire({ managerId: boss.id });
      await change(report.id, { effectiveFrom: ago(1), workMode: "remote" });
      const blocked = await api("admin", "POST", `/hr/employees/${boss.id}/leave`, {
        leftOn: ago(1),
        exitType: "resigned",
        reassignReportsTo: null,
      });
      expect(blocked.statusCode).toBe(409);
      expect((await profile(boss.id)).leftOn).toBeNull();
    });
  });

  describe("delete", () => {
    it("removes a record made by mistake together with its timeline", async () => {
      const hired = await hire();
      await change(hired.id, { effectiveFrom: ago(10), workMode: "remote" });
      expect((await api("admin", "DELETE", `/hr/employees/${hired.id}`)).statusCode).toBe(204);
      expect((await api("admin", "GET", `/hr/employees/${hired.id}`)).statusCode).toBe(404);
      const left = await pool.query<{ total: number }>(
        `select count(*)::int as total from hr.employment_records where employee_id = $1`,
        [hired.id],
      );
      expect(left.rows[0]!.total).toBe(0);
      expect((await api("admin", "DELETE", `/hr/employees/${hired.id}`)).statusCode).toBe(404);
    });

    it("will not delete someone whom other people's history names as their manager", async () => {
      const boss = await hire({ employmentType: "full_time" });
      const report = await hire({ managerId: boss.id });
      expect((await api("admin", "DELETE", `/hr/employees/${boss.id}`)).statusCode).toBe(409);
      expect((await profile(boss.id)).id).toBe(boss.id);
      // Once the history that names them is gone, they can be deleted.
      expect((await api("admin", "DELETE", `/hr/employees/${report.id}`)).statusCode).toBe(204);
      expect((await api("admin", "DELETE", `/hr/employees/${boss.id}`)).statusCode).toBe(204);
    });
  });

  describe("salary and NID are sensitive", () => {
    it("never sends a salary or the full NID to someone without hr.sensitive.read", async () => {
      const hired = await hire({ salary: "15000" });
      await change(hired.id, { effectiveFrom: ago(20), designation: "Marketing Executive", salary: "25000" });

      const asLite = await profile(hired.id, "lite");
      expect(asLite).not.toHaveProperty("salary");
      expect(asLite.nidMasked).toBe(true);
      expect(asLite.nid).toBe(`${"*".repeat(hired.nid.length - 4)}${hired.nid.slice(-4)}`);
      expect(asLite.nid).not.toBe(hired.nid);
      for (const block of asLite.timeline) expect(block).not.toHaveProperty("salary");
      expect(asLite.timeline[0]!.changes.map((c) => c.field)).toEqual(["designation"]);
      // Nowhere in the response, in any form.
      const raw = (await api("lite", "GET", `/hr/employees/${hired.id}`)).body;
      expect(raw).not.toContain("15000");
      expect(raw).not.toContain("25000");
      expect(raw).not.toContain(hired.nid);

      const asAdmin = await profile(hired.id, "admin");
      expect(asAdmin).toMatchObject({ salary: "25000", nid: hired.nid, nidMasked: false });
      expect(asAdmin.timeline[0]!.salary).toBe("25000");
      expect(asAdmin.timeline[0]!.changes.map((c) => c.field)).toEqual(["designation", "salary"]);
    });

    it("leaves the NID and salary out of the list for everyone", async () => {
      const hired = await hire({ salary: "31337" });
      const raw = (await api("admin", "GET", `/hr/employees?q=${hired.employeeId}`)).body;
      expect(raw).not.toContain(hired.nid);
      expect(raw).not.toContain("31337");
    });

    it("lets HR staff without the permission hire and change people, but not set a salary", async () => {
      const hired = await hire({}, "lite");
      expect(hired).not.toHaveProperty("salary");

      const withSalary = await api("lite", "POST", "/hr/employees", person({ salary: "15000" }));
      expect(withSalary.statusCode).toBe(403);
      expect(
        (await api("lite", "POST", `/hr/employees/${hired.id}/employment-changes`, { effectiveFrom: ago(5), salary: "20000" }))
          .statusCode,
      ).toBe(403);

      const promoted = await change(hired.id, { effectiveFrom: ago(5), designation: "Marketing Executive" }, "lite");
      expect(promoted.designation).toBe("Marketing Executive");
      // The salary was never set, so the person with access sees "not set", and a later raise by an admin works.
      expect((await profile(hired.id, "admin")).salary).toBeNull();
      const raised = await change(hired.id, { effectiveFrom: ago(2), salary: "18000" });
      expect(raised.salary).toBe("18000");
      expect(await profile(hired.id, "lite")).not.toHaveProperty("salary");
    });

    it("keeps salary, NID, phone, address, email and names out of the audit log", async () => {
      const hired = await hire({ salary: "27182.5", address: "Secret Lane 77" });
      await change(hired.id, { effectiveFrom: ago(20), salary: "31415.92", note: "private note" });
      await api("admin", "PATCH", `/hr/employees/${hired.id}`, { phone: "01999888777" });
      await api("admin", "POST", `/hr/employees/${hired.id}/leave`, {
        leftOn: ago(1),
        exitType: "resigned",
        exitNote: "private exit note",
      });

      const rows = await pool.query<{ action: string; entity_id: string; metadata: string }>(
        `select action, entity_id, metadata::text as metadata from core.audit_log where actor_id = $1 and action like 'hr.%'`,
        [adminId],
      );
      expect(rows.rows.length).toBeGreaterThan(0);
      const everything = JSON.stringify(rows.rows);
      for (const secret of [
        hired.email,
        hired.nid,
        "Secret Lane",
        "01999888777",
        "27182",
        "31415",
        "private",
        "E2E",
        hired.fullName,
      ])
        expect(everything).not.toContain(secret);
      const actions = rows.rows.map((row) => row.action);
      expect(actions).toEqual(
        expect.arrayContaining(["hr.employee.created", "hr.employment.changed", "hr.employee.updated", "hr.employee.left"]),
      );
    });
  });

  describe("list", () => {
    it("searches name, email, phone, designation and EMP ID, with % and _ taken literally", async () => {
      const special = await hire({ fullName: `${marker} Find_me 100%`, designation: "Quality Wizard" });
      const plain = await hire({ fullName: `${marker} Findxme 1000` });

      const find = async (q: string) =>
        (await api("admin", "GET", `/hr/employees?status=all&pageSize=100&q=${encodeURIComponent(q)}`))
          .json<ListBody>()
          .items.map((item) => item.id);
      expect(await find(special.employeeId)).toEqual([special.id]);
      expect(await find(special.employeeId.toLowerCase().replace("-", ""))).toEqual([special.id]);
      expect(await find(special.email.toUpperCase())).toEqual([special.id]);
      expect(await find("Quality Wizard")).toEqual([special.id]);
      expect(await find("1712-345678")).toEqual(expect.arrayContaining([special.id, plain.id]));
      expect(await find(`${marker} Find_me`)).toEqual([special.id]);
      expect(await find(`${marker} Find`)).toEqual(expect.arrayContaining([special.id, plain.id]));
      expect(await find("Find_me 100%")).toEqual([special.id]);
      expect(await find("%")).not.toContain(plain.id);
    });

    it("filters by department, manager, role type and work mode", async () => {
      const dept = await department();
      const boss = await hire({ employmentType: "full_time" });
      const a = await hire({ departmentId: dept.id, managerId: boss.id, employmentType: "part_time", workMode: "remote" });
      const b = await hire({ departmentId: dept.id, employmentType: "full_time", workMode: "onsite" });

      const ids = async (query: string) =>
        (await api("admin", "GET", `/hr/employees?pageSize=100&${query}`)).json<ListBody>().items.map((item) => item.id);
      expect((await ids(`departmentId=${dept.id}`)).sort()).toEqual([a.id, b.id].sort());
      expect(await ids(`departmentId=${dept.id}&employmentType=part_time`)).toEqual([a.id]);
      expect(await ids(`departmentId=${dept.id}&workMode=onsite`)).toEqual([b.id]);
      expect(await ids(`managerId=${boss.id}`)).toEqual([a.id]);
      expect((await api("admin", "GET", "/hr/employees?workMode=hybried")).statusCode).toBe(400);
    });

    it("sorts, pages and reports the total", async () => {
      const dept = await department();
      const names = ["Charlie", "Alice", "Bob"];
      for (const name of names) await hire({ departmentId: dept.id, fullName: `${marker} ${name}` });

      const page1 = (
        await api("admin", "GET", `/hr/employees?departmentId=${dept.id}&sort=fullName&order=asc&pageSize=2&page=1`)
      ).json<ListBody>();
      const page2 = (
        await api("admin", "GET", `/hr/employees?departmentId=${dept.id}&sort=fullName&order=asc&pageSize=2&page=2`)
      ).json<ListBody>();
      expect(page1.total).toBe(3);
      expect(page1.items.map((item) => item.fullName.replace(`${marker} `, ""))).toEqual(["Alice", "Bob"]);
      expect(page2.items.map((item) => item.fullName.replace(`${marker} `, ""))).toEqual(["Charlie"]);
      const desc = (
        await api("admin", "GET", `/hr/employees?departmentId=${dept.id}&sort=employeeNo&order=desc`)
      ).json<ListBody>();
      expect(desc.items.map((item) => item.employeeNo)).toEqual(
        [...desc.items.map((item) => item.employeeNo)].sort((x, y) => y - x),
      );
      expect((await api("admin", "GET", "/hr/employees?pageSize=101")).statusCode).toBe(400);
    });

    it("lists upcoming employees only when asked", async () => {
      const upcoming = await hire({ joinedOn: ahead(10) });
      const working = (await api("admin", "GET", `/hr/employees?q=${upcoming.employeeId}`)).json<ListBody>();
      expect(working.total).toBe(0);
      const asked = (await api("admin", "GET", `/hr/employees?q=${upcoming.employeeId}&status=upcoming`)).json<ListBody>();
      expect(asked.items.map((item) => item.id)).toEqual([upcoming.id]);
    });

    it("suggests the designations already in use", async () => {
      await hire({ designation: `${marker} Wizard` });
      const body = (await api("admin", "GET", "/hr/designations")).json<{ designations: string[] }>();
      expect(body.designations).toContain(`${marker} Wizard`);
      expect(new Set(body.designations).size).toBe(body.designations.length);
    });

    it("refuses ids that are not UUIDs and answers 404 for unknown ones", async () => {
      expect((await api("admin", "GET", "/hr/employees/not-a-uuid")).statusCode).toBe(400);
      expect((await api("admin", "GET", `/hr/employees/${randomUUID()}`)).statusCode).toBe(404);
      expect((await api("admin", "GET", `/hr/departments/${randomUUID()}`)).statusCode).toBe(404);
    });
  });
});
