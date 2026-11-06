import { Injectable } from "@nestjs/common";
import { and, asc, count, eq, isNotNull, ne, sql } from "drizzle-orm";

import { Database, type DbExecutor } from "../../../shared/db/database";
import { departments, employeesCurrent } from "../schema";

const columns = {
  id: departments.id,
  name: departments.name,
  description: departments.description,
  active: departments.active,
  createdAt: departments.createdAt,
  updatedAt: departments.updatedAt,
};

export interface DepartmentPatch {
  name?: string;
  description?: string;
  active?: boolean;
}

/** The only place that reads or writes `hr.departments`. */
@Injectable()
export class DepartmentsRepo {
  constructor(private readonly database: Database) {}

  async insert(executor: DbExecutor, values: { name: string; description: string; createdBy: string }): Promise<{ id: string }> {
    const [inserted] = await executor
      .insert(departments)
      .values({ ...values, updatedBy: values.createdBy })
      .returning({ id: departments.id });
    return inserted!;
  }

  async list(active?: boolean) {
    return this.database.db
      .select(columns)
      .from(departments)
      .where(active === undefined ? undefined : eq(departments.active, active))
      .orderBy(asc(sql`lower(${departments.name})`), asc(departments.id));
  }

  /** People currently in each department, not counting those who have left. */
  async employeeCounts(): Promise<Map<string, number>> {
    const rows = await this.database.db
      .select({ departmentId: employeesCurrent.departmentId, total: count() })
      .from(employeesCurrent)
      .where(and(isNotNull(employeesCurrent.departmentId), ne(employeesCurrent.status, "left")))
      .groupBy(employeesCurrent.departmentId);
    return new Map(rows.map((row) => [row.departmentId!, row.total]));
  }

  async findById(executor: DbExecutor, id: string) {
    const [row] = await executor.select(columns).from(departments).where(eq(departments.id, id));
    return row ?? null;
  }

  async nameTaken(executor: DbExecutor, name: string, exceptId?: string): Promise<boolean> {
    const conditions = [sql`lower(${departments.name}) = ${name.toLowerCase()}`];
    if (exceptId) conditions.push(ne(departments.id, exceptId));
    const [row] = await executor
      .select({ id: departments.id })
      .from(departments)
      .where(and(...conditions))
      .limit(1);
    return Boolean(row);
  }

  async update(executor: DbExecutor, id: string, patch: DepartmentPatch, actorId: string) {
    await executor
      .update(departments)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(departments.id, id));
  }
}
