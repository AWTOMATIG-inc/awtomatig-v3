import { Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, gt, lt, max, min, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { users } from "../../../shared/auth/auth.schema";
import { type DbExecutor } from "../../../shared/db/database";
import { type EmploymentReason, type EmploymentState } from "../domain/employment-record";
import { departments, employees, employmentRecords } from "../schema";

export interface NewRecord extends EmploymentState {
  employeeId: string;
  effectiveFrom: string;
  reason: EmploymentReason;
  note: string | null;
  createdBy: string;
}

const manager = alias(employees, "manager");

const stateColumns = {
  designation: employmentRecords.designation,
  employmentType: employmentRecords.employmentType,
  workMode: employmentRecords.workMode,
  salary: employmentRecords.salary,
  departmentId: employmentRecords.departmentId,
  managerId: employmentRecords.managerId,
};

/** The only place that reads or writes `hr.employment_records`. Rows are added and deleted, never edited. */
@Injectable()
export class EmploymentRecordsRepo {
  async insert(executor: DbExecutor, values: NewRecord): Promise<{ id: string }> {
    const [inserted] = await executor.insert(employmentRecords).values(values).returning({ id: employmentRecords.id });
    return inserted!;
  }

  /** The whole timeline, oldest first, with the names the screens show. */
  async listForEmployee(executor: DbExecutor, employeeId: string) {
    return executor
      .select({
        id: employmentRecords.id,
        effectiveFrom: employmentRecords.effectiveFrom,
        reason: employmentRecords.reason,
        note: employmentRecords.note,
        createdAt: employmentRecords.createdAt,
        ...stateColumns,
        departmentName: departments.name,
        managerName: manager.fullName,
        managerEmployeeNo: manager.employeeNo,
        recordedBy: users.name,
      })
      .from(employmentRecords)
      .leftJoin(departments, eq(departments.id, employmentRecords.departmentId))
      .leftJoin(manager, eq(manager.id, employmentRecords.managerId))
      .leftJoin(users, eq(users.id, employmentRecords.createdBy))
      .where(eq(employmentRecords.employeeId, employeeId))
      .orderBy(asc(employmentRecords.effectiveFrom), asc(employmentRecords.createdAt));
  }

  async findById(executor: DbExecutor, id: string) {
    const [row] = await executor
      .select({ id: employmentRecords.id, employeeId: employmentRecords.employeeId, reason: employmentRecords.reason })
      .from(employmentRecords)
      .where(eq(employmentRecords.id, id));
    return row ?? null;
  }

  async existsOnDate(executor: DbExecutor, employeeId: string, date: string): Promise<boolean> {
    const [row] = await executor
      .select({ id: employmentRecords.id })
      .from(employmentRecords)
      .where(and(eq(employmentRecords.employeeId, employeeId), eq(employmentRecords.effectiveFrom, date)))
      .limit(1);
    return Boolean(row);
  }

  /** The state in force just before `date`: the newest record dated earlier. A change on `date` starts from this. */
  async stateBefore(executor: DbExecutor, employeeId: string, date: string) {
    const [row] = await executor
      .select({ effectiveFrom: employmentRecords.effectiveFrom, ...stateColumns })
      .from(employmentRecords)
      .where(and(eq(employmentRecords.employeeId, employeeId), lt(employmentRecords.effectiveFrom, date)))
      .orderBy(desc(employmentRecords.effectiveFrom))
      .limit(1);
    return row ?? null;
  }

  /** The date of the newest record, or null if there is none. */
  async latestDate(executor: DbExecutor, employeeId: string): Promise<string | null> {
    const [row] = await executor
      .select({ date: max(employmentRecords.effectiveFrom) })
      .from(employmentRecords)
      .where(eq(employmentRecords.employeeId, employeeId));
    return row?.date ?? null;
  }

  /** The earliest record that is not the "Joined" one: the joining date cannot move past it. */
  async earliestAfterJoined(executor: DbExecutor, employeeId: string): Promise<string | null> {
    const [row] = await executor
      .select({ date: min(employmentRecords.effectiveFrom) })
      .from(employmentRecords)
      .where(and(eq(employmentRecords.employeeId, employeeId), ne(employmentRecords.reason, "joined")));
    return row?.date ?? null;
  }

  async countAfter(executor: DbExecutor, employeeId: string, date: string): Promise<number> {
    const [row] = await executor
      .select({ total: count() })
      .from(employmentRecords)
      .where(and(eq(employmentRecords.employeeId, employeeId), gt(employmentRecords.effectiveFrom, date)));
    return row?.total ?? 0;
  }

  /** Keeps the "Joined" record on the joining date when that date is corrected. */
  async moveJoined(executor: DbExecutor, employeeId: string, date: string) {
    await executor
      .update(employmentRecords)
      .set({ effectiveFrom: date })
      .where(and(eq(employmentRecords.employeeId, employeeId), eq(employmentRecords.reason, "joined")));
  }

  async delete(executor: DbExecutor, id: string) {
    await executor.delete(employmentRecords).where(eq(employmentRecords.id, id));
  }
}
