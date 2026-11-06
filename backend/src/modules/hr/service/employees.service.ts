import { Injectable, Logger } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { Database, type DbExecutor, type Tx } from "../../../shared/db/database";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { StorageService } from "../../../shared/storage/storage.service";
import {
  type CreateEmployeeInput,
  type EmployeeStatus,
  type EmploymentType,
  formatEmployeeId,
  type LeaveInput,
  type ListEmployeesQuery,
  maskNid,
  normalizeAmount,
  type UpdateEmployeeInput,
  type WorkMode,
  type ExitType,
} from "../domain/employee";
import { calculatePeriod, countingEnd, dhakaToday } from "../domain/employment-period";
import {
  applyChange,
  buildTimeline,
  changedFields,
  effectiveDateProblem,
  type EmploymentChangeInput,
  type EmploymentReason,
  type EmploymentState,
  suggestReason,
  type StateField,
  type TimelineRecord,
} from "../domain/employment-record";
import { createsManagerLoop } from "../domain/org";
import { DepartmentsRepo } from "../repo/departments.repo";
import { DocumentsRepo } from "../repo/documents.repo";
import { type CurrentRow, type EmployeePatch, EmployeesRepo } from "../repo/employees.repo";
import { EmploymentRecordsRepo } from "../repo/employment-records.repo";
import { isUniqueViolation } from "./unique-violation";

/** Who is asking. Salary and the full NID are only sent when `canSeeSensitive` is true; the check is made here, not on screen. */
export interface Viewer {
  userId: string;
  canSeeSensitive: boolean;
}

type TimelineItem = TimelineRecord & {
  note: string | null;
  createdAt: Date;
  recordedBy: string | null;
  departmentName: string | null;
  managerName: string | null;
  managerEmployeeNo: number | null;
};

const EMAIL_TAKEN = "An employee with this email already exists";
const NID_TAKEN = "An employee with this NID already exists";

function ref(id: string | null, name: string | null) {
  return id !== null && name !== null ? { id, name } : null;
}

function managerRef(id: string | null, employeeNo: number | null, name: string | null) {
  return id !== null && name !== null && employeeNo !== null
    ? { id, employeeId: formatEmployeeId(employeeNo), fullName: name }
    : null;
}

/**
 * Use cases for employees and their timeline. Employment details live only in the timeline (`employment_records`); "current" is
 * read through the `employees_current` view, so there is no second copy to keep in step. Every write that touches one employee locks
 * that employee's row first and runs in one transaction with its audit entry. Audit entries hold ids and field names only, never a
 * name, NID, phone, address, email or salary.
 */
@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly database: Database,
    private readonly employees: EmployeesRepo,
    private readonly records: EmploymentRecordsRepo,
    private readonly departments: DepartmentsRepo,
    private readonly documents: DocumentsRepo,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  /** Creates the person and their "Joined" timeline entry together. */
  async create(input: CreateEmployeeInput, viewer: Viewer) {
    if (input.salary !== null && !viewer.canSeeSensitive) throw new ForbiddenError("You are not allowed to set salaries");
    try {
      return await this.database.transaction(async (tx) => {
        if (await this.employees.emailTaken(tx, input.email)) throw new ConflictError(EMAIL_TAKEN, { email: EMAIL_TAKEN });
        if (await this.employees.nidTaken(tx, input.nid)) throw new ConflictError(NID_TAKEN, { nid: NID_TAKEN });
        if (input.departmentId) await this.checkDepartment(tx, input.departmentId);
        if (input.managerId)
          await this.checkManager(tx, { employeeId: null, managerId: input.managerId, effectiveFrom: input.joinedOn });

        const inserted = await this.employees.insert(tx, {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          address: input.address,
          nid: input.nid,
          joinedOn: input.joinedOn,
          createdBy: viewer.userId,
        });
        await this.records.insert(tx, {
          employeeId: inserted.id,
          effectiveFrom: input.joinedOn,
          reason: "joined",
          designation: input.designation,
          employmentType: input.employmentType,
          workMode: input.workMode,
          salary: input.salary,
          departmentId: input.departmentId,
          managerId: input.managerId,
          note: input.note || null,
          createdBy: viewer.userId,
        });
        await this.audit.record(
          { action: "hr.employee.created", actorId: viewer.userId, entityType: "employee", entityId: inserted.id },
          tx,
        );
        return this.load(tx, inserted.id, viewer);
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }
  }

  async list(query: ListEmployeesQuery) {
    const today = dhakaToday();
    const { items, total } = await this.employees.list({
      status: query.status,
      q: query.q || undefined,
      departmentId: query.departmentId,
      managerId: query.managerId,
      employmentType: query.employmentType,
      workMode: query.workMode,
      sort: query.sort,
      order: query.order,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return { items: items.map((row) => this.summary(row, today)), total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string, viewer: Viewer) {
    return this.database.transaction((tx) => this.load(tx, id, viewer));
  }

  /** Personal details and the joining date. Employment details change through `changeEmployment`. */
  async update(id: string, input: UpdateEmployeeInput, viewer: Viewer) {
    try {
      return await this.database.transaction(async (tx) => {
        const row = await this.employees.findForUpdate(tx, id);
        if (!row) throw new NotFoundError("Employee not found");

        if (input.email !== undefined && (await this.employees.emailTaken(tx, input.email, id))) {
          throw new ConflictError(EMAIL_TAKEN, { email: EMAIL_TAKEN });
        }
        if (input.nid !== undefined && (await this.employees.nidTaken(tx, input.nid, id))) {
          throw new ConflictError(NID_TAKEN, { nid: NID_TAKEN });
        }

        const joinedMoved = input.joinedOn !== undefined && input.joinedOn !== row.joinedOn;
        if (joinedMoved) {
          const earliest = await this.records.earliestAfterJoined(tx, id);
          if (earliest !== null && input.joinedOn! >= earliest) {
            throw new ValidationError("The joining date must be before the first change in the timeline", {
              joinedOn: `The joining date must be before the first change in the timeline (${earliest})`,
            });
          }
          if (row.leftOn !== null && input.joinedOn! > row.leftOn) {
            throw new ValidationError("The joining date cannot be after the leaving date", {
              joinedOn: "The joining date cannot be after the leaving date",
            });
          }
        }

        const patch = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as EmployeePatch;
        await this.employees.update(tx, id, patch, viewer.userId);
        if (joinedMoved) await this.records.moveJoined(tx, id, input.joinedOn!);
        await this.audit.record(
          {
            action: "hr.employee.updated",
            actorId: viewer.userId,
            entityType: "employee",
            entityId: id,
            metadata: { fields: Object.keys(patch) },
          },
          tx,
        );
        return this.load(tx, id, viewer);
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }
  }

  /**
   * Adds one timeline entry. Only the fields sent change; the rest carry forward from the stint in force the day before. A date in
   * the past fills in history, a date in the future schedules the change. Nothing is edited: a mistake is fixed with a Correction
   * entry or by removing the wrong one.
   */
  async changeEmployment(id: string, input: EmploymentChangeInput, viewer: Viewer) {
    if (input.salary !== undefined && !viewer.canSeeSensitive) throw new ForbiddenError("You are not allowed to set salaries");
    return this.database.transaction(async (tx) => {
      const employee = await this.employees.findForUpdate(tx, id);
      if (!employee) throw new NotFoundError("Employee not found");

      const problem = effectiveDateProblem({
        effectiveFrom: input.effectiveFrom,
        joinedOn: employee.joinedOn,
        leftOn: employee.leftOn,
      });
      if (problem) throw new ValidationError(problem, { effectiveFrom: problem });
      if (await this.records.existsOnDate(tx, id, input.effectiveFrom)) {
        const message = "There is already a change on this date";
        throw new ConflictError(message, { effectiveFrom: message });
      }

      const previous = await this.records.stateBefore(tx, id, input.effectiveFrom);
      if (!previous)
        throw new ValidationError("The change cannot take effect before the joining date", { effectiveFrom: "Too early" });
      const base = toState(previous);
      const next = applyChange(base, {
        designation: input.designation,
        employmentType: input.employmentType,
        workMode: input.workMode,
        salary: input.salary,
        departmentId: input.departmentId,
        managerId: input.managerId,
      });
      const fields = changedFields(base, next);
      if (fields.length === 0) throw new ValidationError("Nothing changed", { form: "Change at least one detail" });

      // Only a department or manager that is actually changing is checked, so carrying forward one that has since been
      // deactivated, or a manager who has since left, never blocks an unrelated change.
      if (fields.includes("departmentId") && next.departmentId) await this.checkDepartment(tx, next.departmentId);
      if (fields.includes("managerId") && next.managerId) {
        await this.checkManager(tx, { employeeId: id, managerId: next.managerId, effectiveFrom: input.effectiveFrom });
      }

      const reason: EmploymentReason = input.reason ?? suggestReason(fields);
      const inserted = await this.records.insert(tx, {
        employeeId: id,
        effectiveFrom: input.effectiveFrom,
        reason,
        ...next,
        note: input.note || null,
        createdBy: viewer.userId,
      });
      await this.audit.record(
        {
          action: "hr.employment.changed",
          actorId: viewer.userId,
          entityType: "employee",
          entityId: id,
          metadata: { recordId: inserted.id, reason, fields },
        },
        tx,
      );
      return this.load(tx, id, viewer);
    });
  }

  /** Removes a wrongly added timeline entry. The "Joined" entry stays; the current values follow automatically. */
  async removeEmployment(id: string, recordId: string, viewer: Viewer) {
    return this.database.transaction(async (tx) => {
      const employee = await this.employees.findForUpdate(tx, id);
      if (!employee) throw new NotFoundError("Employee not found");
      const record = await this.records.findById(tx, recordId);
      if (!record || record.employeeId !== id) throw new NotFoundError("Timeline entry not found");
      if (record.reason === "joined") throw new ConflictError("The Joined entry cannot be removed");

      await this.records.delete(tx, recordId);
      await this.audit.record(
        {
          action: "hr.employment.removed",
          actorId: viewer.userId,
          entityType: "employee",
          entityId: id,
          metadata: { recordId, reason: record.reason },
        },
        tx,
      );
      return this.load(tx, id, viewer);
    });
  }

  /**
   * Marks the employee as leaving on a date (which may still be ahead). Anyone who reports to them must be handed over in the same
   * step: each gets a "Manager change" entry on the leaving date.
   */
  async leave(id: string, input: LeaveInput, viewer: Viewer) {
    return this.database.transaction(async (tx) => {
      const employee = await this.employees.findForUpdate(tx, id);
      if (!employee) throw new NotFoundError("Employee not found");
      if (employee.leftOn !== null)
        throw new ConflictError("This employee is already marked as left. Reinstate them first to change it");
      if (input.leftOn < employee.joinedOn) {
        const message = "The leaving date cannot be before the joining date";
        throw new ValidationError(message, { leftOn: message });
      }
      if ((await this.records.countAfter(tx, id, input.leftOn)) > 0) {
        const message = "Remove the timeline entries dated after the leaving date first";
        throw new ValidationError(message, { leftOn: message });
      }

      const reports = await this.employees.directReports(tx, id);
      if (reports.length > 0 && input.reassignReportsTo === undefined) {
        throw new ConflictError(
          `${reports.length} ${reports.length === 1 ? "person reports" : "people report"} to this employee. Choose who takes over`,
          {
            directReports: reports.length,
          },
        );
      }

      if (reports.length > 0) {
        const newManagerId = input.reassignReportsTo ?? null;
        if (newManagerId !== null) {
          if (newManagerId === id)
            throw new ValidationError("Choose someone other than the employee who is leaving", {
              reassignReportsTo: "Choose someone else",
            });
          await this.checkManager(tx, { employeeId: null, managerId: newManagerId, effectiveFrom: input.leftOn });
        }
        for (const report of reports) {
          if (
            newManagerId !== null &&
            (await createsManagerLoop(report.id, newManagerId, (who) => this.employees.currentManagerOf(tx, who)))
          ) {
            throw new ValidationError("That would make someone their own manager", {
              reassignReportsTo: "That would create a reporting loop",
            });
          }
          const latest = await this.records.latestDate(tx, report.id);
          if (latest !== null && latest >= input.leftOn) {
            throw new ConflictError(
              `${formatEmployeeId(report.employeeNo)} already has a change on or after the leaving date. Update their manager first`,
              {
                employeeId: formatEmployeeId(report.employeeNo),
              },
            );
          }
          const previous = await this.records.stateBefore(tx, report.id, input.leftOn);
          if (!previous) continue;
          await this.records.insert(tx, {
            employeeId: report.id,
            effectiveFrom: input.leftOn,
            reason: "manager_change",
            ...toState(previous),
            managerId: newManagerId,
            note: "Manager left the company",
            createdBy: viewer.userId,
          });
        }
      }

      await this.employees.update(
        tx,
        id,
        { leftOn: input.leftOn, exitType: input.exitType, exitNote: input.exitNote || null },
        viewer.userId,
      );
      await this.audit.record(
        {
          action: "hr.employee.left",
          actorId: viewer.userId,
          entityType: "employee",
          entityId: id,
          metadata: { exitType: input.exitType, reassigned: reports.length },
        },
        tx,
      );
      return this.load(tx, id, viewer);
    });
  }

  /** Undoes a mistaken "Mark as left". A real re-hire after a gap is a later phase. */
  async reinstate(id: string, viewer: Viewer) {
    return this.database.transaction(async (tx) => {
      const employee = await this.employees.findForUpdate(tx, id);
      if (!employee) throw new NotFoundError("Employee not found");
      if (employee.leftOn === null) throw new ConflictError("This employee has not been marked as left");

      await this.employees.update(tx, id, { leftOn: null, exitType: null, exitNote: null }, viewer.userId);
      await this.audit.record(
        { action: "hr.employee.reinstated", actorId: viewer.userId, entityType: "employee", entityId: id },
        tx,
      );
      return this.load(tx, id, viewer);
    });
  }

  /** For a record created by mistake. Anyone who worked here is marked as left instead, so their history is kept. */
  async remove(id: string, viewer: Viewer) {
    const keys = await this.database.transaction(async (tx) => {
      const employee = await this.employees.findForUpdate(tx, id);
      if (!employee) throw new NotFoundError("Employee not found");
      if (await this.employees.isManagerInOthersHistory(tx, id)) {
        throw new ConflictError(
          "Other people's history names this employee as their manager. Mark them as left instead of deleting them",
        );
      }
      const stored = await this.documents.keysForEmployee(tx, id);
      await this.employees.delete(tx, id);
      await this.audit.record(
        { action: "hr.employee.deleted", actorId: viewer.userId, entityType: "employee", entityId: id },
        tx,
      );
      return stored;
    });
    // The rows are gone (they cascade), so remove their files too. A file that cannot be removed is logged by count, never by name.
    let failed = 0;
    for (const key of keys) {
      try {
        await this.storage.delete(key);
      } catch {
        failed += 1;
      }
    }
    if (failed > 0) this.logger.warn(`Could not remove ${failed} document file(s) of a deleted employee (employee ${id})`);
  }

  async designations() {
    return { designations: await this.employees.designations() };
  }

  // --- checks -------------------------------------------------------------------------------------------------------------

  private async checkDepartment(tx: Tx, departmentId: string) {
    const department = await this.departments.findById(tx, departmentId);
    if (!department)
      throw new ValidationError("That department does not exist", { departmentId: "That department does not exist" });
    if (!department.active)
      throw new ValidationError("That department is inactive", { departmentId: "That department is inactive" });
  }

  /** The manager must exist, be with the company on the effective date, and not close a reporting loop. */
  private async checkManager(tx: Tx, input: { employeeId: string | null; managerId: string; effectiveFrom: string }) {
    const fail = (message: string): never => {
      throw new ValidationError(message, { managerId: message });
    };
    if (input.managerId === input.employeeId) fail("An employee cannot be their own manager");
    const manager = await this.employees.findCurrent(tx, input.managerId);
    if (!manager) fail("That manager does not exist");
    if (manager!.joinedOn > input.effectiveFrom) fail("That manager had not joined yet on that date");
    if (manager!.leftOn !== null && manager!.leftOn < input.effectiveFrom) fail("That manager had already left on that date");
    if (
      input.employeeId !== null &&
      (await createsManagerLoop(input.employeeId, input.managerId, (who) => this.employees.currentManagerOf(tx, who)))
    ) {
      fail("That would create a reporting loop");
    }
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (!isUniqueViolation(error)) return error;
    const text = error instanceof Error ? `${error.message} ${(error.cause as Error | undefined)?.message ?? ""}` : "";
    if (text.includes("employees_nid_key")) return new ConflictError(NID_TAKEN, { nid: NID_TAKEN });
    if (text.includes("employees_email_key")) return new ConflictError(EMAIL_TAKEN, { email: EMAIL_TAKEN });
    return new ConflictError("This change conflicts with an existing record");
  }

  // --- presentation -------------------------------------------------------------------------------------------------------

  private summary(row: CurrentRow, today: string) {
    return {
      id: row.id,
      employeeNo: row.employeeNo,
      employeeId: formatEmployeeId(row.employeeNo),
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      status: row.status as EmployeeStatus,
      joinedOn: row.joinedOn,
      leftOn: row.leftOn,
      designation: row.designation ?? "",
      employmentType: (row.employmentType ?? "full_time") as EmploymentType,
      workMode: (row.workMode ?? "onsite") as WorkMode,
      department: ref(row.departmentId, row.departmentName),
      manager: managerRef(row.managerId, row.managerEmployeeNo, row.managerName),
      period: calculatePeriod(row.joinedOn, countingEnd(row.leftOn, today)),
    };
  }

  /** The full profile: details, the timeline (newest first) and direct reports. Salary and the full NID only for `canSeeSensitive`. */
  private async load(executor: DbExecutor, id: string, viewer: Viewer) {
    const today = dhakaToday();
    const current = await this.employees.findCurrent(executor, id);
    if (!current) throw new NotFoundError("Employee not found");
    const [rows, reports] = await Promise.all([
      this.records.listForEmployee(executor, id),
      this.employees.directReports(executor, id),
    ]);

    const items: TimelineItem[] = rows.map((row) => ({
      id: row.id,
      effectiveFrom: row.effectiveFrom,
      reason: row.reason as EmploymentReason,
      designation: row.designation,
      employmentType: row.employmentType as EmploymentType,
      workMode: row.workMode as WorkMode,
      salary: normalizeAmount(row.salary),
      departmentId: row.departmentId,
      managerId: row.managerId,
      note: row.note,
      createdAt: row.createdAt,
      recordedBy: row.recordedBy,
      departmentName: row.departmentName,
      managerName: row.managerName,
      managerEmployeeNo: row.managerEmployeeNo,
    }));

    // Department and manager changes are shown by name, so they are looked up from the entries themselves.
    const departmentNames = new Map(
      items.flatMap((item) =>
        item.departmentId && item.departmentName ? [[item.departmentId, item.departmentName] as const] : [],
      ),
    );
    const managerNames = new Map(
      items.flatMap((item) => (item.managerId && item.managerName ? [[item.managerId, item.managerName] as const] : [])),
    );
    const label = (field: StateField, value: string | null): string | null => {
      if (value === null) return null;
      if (field === "departmentId") return departmentNames.get(value) ?? null;
      if (field === "managerId") return managerNames.get(value) ?? null;
      return value;
    };

    const timeline = buildTimeline(items, current.leftOn, today)
      .map((block) => ({
        id: block.record.id,
        effectiveFrom: block.record.effectiveFrom,
        endsOn: block.endsOn,
        status: block.status,
        reason: block.record.reason,
        note: block.record.note,
        period: block.period,
        designation: block.record.designation,
        employmentType: block.record.employmentType,
        workMode: block.record.workMode,
        ...(viewer.canSeeSensitive ? { salary: block.record.salary } : {}),
        department: ref(block.record.departmentId, block.record.departmentName),
        manager: managerRef(block.record.managerId, block.record.managerEmployeeNo, block.record.managerName),
        changes: block.changes
          .filter((change) => viewer.canSeeSensitive || change.field !== "salary")
          .map((change) => ({ field: change.field, from: label(change.field, change.from), to: label(change.field, change.to) })),
        recordedBy: block.record.recordedBy,
        createdAt: block.record.createdAt.toISOString(),
      }))
      .reverse();

    return {
      ...this.summary(current, today),
      address: current.address,
      nid: viewer.canSeeSensitive ? current.nid : maskNid(current.nid),
      nidMasked: !viewer.canSeeSensitive,
      ...(viewer.canSeeSensitive ? { salary: normalizeAmount(current.salary) } : {}),
      exitType: (current.exitType as ExitType | null) ?? null,
      exitNote: current.exitNote,
      createdAt: current.createdAt.toISOString(),
      updatedAt: current.updatedAt.toISOString(),
      directReports: reports.map((report) => ({
        id: report.id,
        employeeId: formatEmployeeId(report.employeeNo),
        fullName: report.fullName,
        designation: report.designation ?? "",
      })),
      timeline,
    };
  }
}

function toState(row: {
  designation: string;
  employmentType: string;
  workMode: string;
  salary: string | null;
  departmentId: string | null;
  managerId: string | null;
}): EmploymentState {
  return {
    designation: row.designation,
    employmentType: row.employmentType as EmploymentType,
    workMode: row.workMode as WorkMode,
    salary: normalizeAmount(row.salary),
    departmentId: row.departmentId,
    managerId: row.managerId,
  };
}
