import { Injectable } from "@nestjs/common";
import { and, asc, count, eq, gt, isNotNull, isNull, lte, or, sql } from "drizzle-orm";

import { users } from "../../../shared/auth/auth.schema";
import { type DbExecutor } from "../../../shared/db/database";
import { type DocumentType } from "../domain/document";
import { employeeDocuments, employees } from "../schema";

export interface NewDocument {
  id: string;
  employeeId: string;
  docType: DocumentType;
  title: string;
  fileName: string;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
  expiresOn: string | null;
  note: string;
  createdBy: string;
}

export interface DocumentPatch {
  title?: string;
  expiresOn?: string | null;
  note?: string;
}

const columns = {
  id: employeeDocuments.id,
  employeeId: employeeDocuments.employeeId,
  docType: employeeDocuments.docType,
  title: employeeDocuments.title,
  fileName: employeeDocuments.fileName,
  contentType: employeeDocuments.contentType,
  sizeBytes: employeeDocuments.sizeBytes,
  expiresOn: employeeDocuments.expiresOn,
  note: employeeDocuments.note,
  createdAt: employeeDocuments.createdAt,
  updatedAt: employeeDocuments.updatedAt,
  uploadedBy: users.name,
};

/** The only place that reads or writes `hr.employee_documents`. Never returns a storage key except where the caller needs it. */
@Injectable()
export class DocumentsRepo {
  async insert(executor: DbExecutor, values: NewDocument) {
    await executor.insert(employeeDocuments).values({ ...values, updatedBy: values.createdBy });
  }

  /**
   * Documents that expire on or before `until` (already expired ones included) for people still working or starting, earliest
   * first. `expired` counts those already past `today`.
   */
  async expiringUntil(executor: DbExecutor, today: string, until: string, limit: number) {
    const where = and(
      isNotNull(employeeDocuments.expiresOn),
      lte(employeeDocuments.expiresOn, until),
      or(isNull(employees.leftOn), gt(employees.leftOn, today)),
    );
    const [totals] = await executor
      .select({
        total: count(),
        expired: sql<number>`count(*) filter (where ${employeeDocuments.expiresOn} < ${today})::int`,
      })
      .from(employeeDocuments)
      .innerJoin(employees, eq(employees.id, employeeDocuments.employeeId))
      .where(where);
    const items = await executor
      .select({
        id: employeeDocuments.id,
        employeeId: employees.id,
        employeeNo: employees.employeeNo,
        fullName: employees.fullName,
        docType: employeeDocuments.docType,
        title: employeeDocuments.title,
        expiresOn: employeeDocuments.expiresOn,
      })
      .from(employeeDocuments)
      .innerJoin(employees, eq(employees.id, employeeDocuments.employeeId))
      .where(where)
      .orderBy(asc(employeeDocuments.expiresOn), asc(employeeDocuments.id))
      .limit(limit);
    return { total: totals?.total ?? 0, expired: totals?.expired ?? 0, items };
  }

  /** Oldest first, so the table reads in the order the files were added. */
  async listForEmployee(executor: DbExecutor, employeeId: string) {
    return executor
      .select(columns)
      .from(employeeDocuments)
      .leftJoin(users, eq(users.id, employeeDocuments.createdBy))
      .where(eq(employeeDocuments.employeeId, employeeId))
      .orderBy(asc(employeeDocuments.createdAt), asc(employeeDocuments.id));
  }

  async findById(executor: DbExecutor, employeeId: string, id: string) {
    const [row] = await executor
      .select(columns)
      .from(employeeDocuments)
      .leftJoin(users, eq(users.id, employeeDocuments.createdBy))
      .where(and(eq(employeeDocuments.id, id), eq(employeeDocuments.employeeId, employeeId)));
    return row ?? null;
  }

  /** The object key and type, for a signed link or a delete. */
  async findStorage(executor: DbExecutor, employeeId: string, id: string) {
    const [row] = await executor
      .select({ storageKey: employeeDocuments.storageKey, docType: employeeDocuments.docType })
      .from(employeeDocuments)
      .where(and(eq(employeeDocuments.id, id), eq(employeeDocuments.employeeId, employeeId)));
    return row ?? null;
  }

  async keysForEmployee(executor: DbExecutor, employeeId: string): Promise<string[]> {
    const rows = await executor
      .select({ storageKey: employeeDocuments.storageKey })
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employeeId));
    return rows.map((row) => row.storageKey);
  }

  async countForEmployee(executor: DbExecutor, employeeId: string): Promise<number> {
    const [row] = await executor
      .select({ total: count() })
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, employeeId));
    return row?.total ?? 0;
  }

  async update(executor: DbExecutor, id: string, patch: DocumentPatch, actorId: string) {
    await executor
      .update(employeeDocuments)
      .set({ ...patch, updatedBy: actorId })
      .where(eq(employeeDocuments.id, id));
  }

  async delete(executor: DbExecutor, id: string) {
    await executor.delete(employeeDocuments).where(eq(employeeDocuments.id, id));
  }
}
