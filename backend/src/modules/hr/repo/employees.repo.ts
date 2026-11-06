import { Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, ilike, inArray, ne, or, type SQL, sql } from "drizzle-orm";

import { Database, type DbExecutor } from "../../../shared/db/database";
import { escapeLike, type EmployeeSortField, type ExitType, parseEmployeeId } from "../domain/employee";
import { employees, employeesCurrent, employmentRecords } from "../schema";

export type CurrentRow = typeof employeesCurrent.$inferSelect;

export interface NewEmployee {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  nid: string;
  joinedOn: string;
  createdBy: string;
}

export interface EmployeePatch {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  nid?: string;
  joinedOn?: string;
  leftOn?: string | null;
  exitType?: ExitType | null;
  exitNote?: string | null;
}

export interface EmployeeFilter {
  status: "working" | "left" | "upcoming" | "all";
  q?: string;
  departmentId?: string;
  managerId?: string;
  employmentType?: string;
  workMode?: string;
  sort: EmployeeSortField;
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

const WORKING_STATUSES = ["active", "leaving"];

/** The only place that reads or writes `hr.employees`, and the only reader of the `hr.employees_current` view. */
@Injectable()
export class EmployeesRepo {
  constructor(private readonly database: Database) {}

  async insert(executor: DbExecutor, values: NewEmployee): Promise<{ id: string; employeeNo: number }> {
    const [inserted] = await executor
      .insert(employees)
      .values({ ...values, updatedBy: values.createdBy })
      .returning({ id: employees.id, employeeNo: employees.employeeNo });
    return inserted!;
  }

  /** Locks the person until the transaction ends, so two people cannot change the same history at once. */
  async findForUpdate(executor: DbExecutor, id: string) {
    const [row] = await executor
      .select({
        id: employees.id,
        employeeNo: employees.employeeNo,
        joinedOn: employees.joinedOn,
        leftOn: employees.leftOn,
      })
      .from(employees)
      .where(eq(employees.id, id))
      .for("update");
    return row ?? null;
  }

  /** Who the employee is, for naming their document folder. */
  async findIdentity(executor: DbExecutor, id: string) {
    const [row] = await executor
      .select({ id: employees.id, employeeNo: employees.employeeNo, fullName: employees.fullName })
      .from(employees)
      .where(eq(employees.id, id));
    return row ?? null;
  }

  async update(executor: DbExecutor, id: string, patch: EmployeePatch, actorId: string) {
    await executor
      .update(employees)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(employees.id, id));
  }

  async delete(executor: DbExecutor, id: string) {
    await executor.delete(employees).where(eq(employees.id, id));
  }

  async emailTaken(executor: DbExecutor, email: string, exceptId?: string): Promise<boolean> {
    const conditions: SQL[] = [sql`lower(${employees.email}) = ${email.toLowerCase()}`];
    if (exceptId) conditions.push(ne(employees.id, exceptId));
    const [row] = await executor
      .select({ id: employees.id })
      .from(employees)
      .where(and(...conditions))
      .limit(1);
    return Boolean(row);
  }

  async nidTaken(executor: DbExecutor, nid: string, exceptId?: string): Promise<boolean> {
    const conditions: SQL[] = [eq(employees.nid, nid)];
    if (exceptId) conditions.push(ne(employees.id, exceptId));
    const [row] = await executor
      .select({ id: employees.id })
      .from(employees)
      .where(and(...conditions))
      .limit(1);
    return Boolean(row);
  }

  async findCurrent(executor: DbExecutor, id: string): Promise<CurrentRow | null> {
    const [row] = await executor.select().from(employeesCurrent).where(eq(employeesCurrent.id, id));
    return row ?? null;
  }

  /** The employee's manager today, or null. Used to walk up the chain when checking for loops. */
  async currentManagerOf(executor: DbExecutor, id: string): Promise<string | null> {
    const [row] = await executor
      .select({ managerId: employeesCurrent.managerId })
      .from(employeesCurrent)
      .where(eq(employeesCurrent.id, id));
    return row?.managerId ?? null;
  }

  /** People who report to this employee today and are still with the company (or about to join). */
  async directReports(executor: DbExecutor, managerId: string) {
    return executor
      .select({
        id: employeesCurrent.id,
        employeeNo: employeesCurrent.employeeNo,
        fullName: employeesCurrent.fullName,
        designation: employeesCurrent.designation,
      })
      .from(employeesCurrent)
      .where(and(eq(employeesCurrent.managerId, managerId), ne(employeesCurrent.status, "left")))
      .orderBy(asc(employeesCurrent.fullName), asc(employeesCurrent.id));
  }

  /** Whether anyone else's history names this employee as their manager (which blocks deleting them). */
  async isManagerInOthersHistory(executor: DbExecutor, id: string): Promise<boolean> {
    const [row] = await executor
      .select({ id: employmentRecords.id })
      .from(employmentRecords)
      .where(and(eq(employmentRecords.managerId, id), ne(employmentRecords.employeeId, id)))
      .limit(1);
    return Boolean(row);
  }

  /** Headcount and this month's joiners and leavers, for the dashboard. `monthStart` / `nextMonthStart` are Dhaka dates. */
  async headcount(monthStart: string, nextMonthStart: string) {
    const [row] = await this.database.db
      .select({
        working: sql<number>`count(*) filter (where ${inArray(employeesCurrent.status, WORKING_STATUSES)})::int`,
        joinedThisMonth: sql<number>`count(*) filter (where ${employeesCurrent.joinedOn} >= ${monthStart} and ${employeesCurrent.joinedOn} < ${nextMonthStart})::int`,
        leftThisMonth: sql<number>`count(*) filter (where ${employeesCurrent.leftOn} >= ${monthStart} and ${employeesCurrent.leftOn} < ${nextMonthStart})::int`,
      })
      .from(employeesCurrent);
    return row ?? { working: 0, joinedThisMonth: 0, leftThisMonth: 0 };
  }

  async list(filter: EmployeeFilter) {
    const conditions: SQL[] = [];
    if (filter.status === "working") conditions.push(inArray(employeesCurrent.status, WORKING_STATUSES));
    else if (filter.status !== "all") conditions.push(eq(employeesCurrent.status, filter.status));
    if (filter.departmentId) conditions.push(eq(employeesCurrent.departmentId, filter.departmentId));
    if (filter.managerId) conditions.push(eq(employeesCurrent.managerId, filter.managerId));
    if (filter.employmentType) conditions.push(eq(employeesCurrent.employmentType, filter.employmentType));
    if (filter.workMode) conditions.push(eq(employeesCurrent.workMode, filter.workMode));
    if (filter.q) {
      const term = `%${escapeLike(filter.q)}%`;
      const employeeNo = parseEmployeeId(filter.q);
      const match = or(
        ilike(employeesCurrent.fullName, term),
        ilike(employeesCurrent.email, term),
        ilike(employeesCurrent.phone, term),
        ilike(employeesCurrent.designation, term),
        employeeNo !== null ? eq(employeesCurrent.employeeNo, employeeNo) : undefined,
      );
      if (match) conditions.push(match);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const column = {
      fullName: employeesCurrent.fullName,
      employeeNo: employeesCurrent.employeeNo,
      joinedOn: employeesCurrent.joinedOn,
      designation: employeesCurrent.designation,
    }[filter.sort];
    const direction = filter.order === "asc" ? asc : desc;

    const db = this.database.db;
    const [items, totals] = await Promise.all([
      // `id` as a tie-breaker keeps pages stable when many rows share a value.
      db
        .select()
        .from(employeesCurrent)
        .where(where)
        .orderBy(direction(column), desc(employeesCurrent.id))
        .limit(filter.limit)
        .offset(filter.offset),
      db.select({ total: count() }).from(employeesCurrent).where(where),
    ]);
    return { items, total: totals[0]?.total ?? 0 };
  }

  /** Designations already in use, most used first, so the form can suggest them and spelling stays consistent. */
  async designations(): Promise<string[]> {
    const rows = await this.database.db
      .select({ designation: employmentRecords.designation, uses: count() })
      .from(employmentRecords)
      .groupBy(employmentRecords.designation)
      .orderBy(desc(count()), asc(employmentRecords.designation))
      .limit(200);
    return rows.map((row) => row.designation);
  }
}
