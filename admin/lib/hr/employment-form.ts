import type { components } from "@/lib/api/schema";
import { formatPlainDate } from "@/lib/format";

import { todayInDhaka } from "./dates";
import {
  type ChangeReason,
  changeValue,
  type Department,
  type Employee,
  EMPLOYMENT_TYPE_LABEL,
  type EmploymentType,
  FIELD_LABEL,
  type StateField,
  type WorkMode,
  WORK_MODE_LABEL,
} from "./employees";

export type EmploymentChangeBody = components["schemas"]["EmploymentChangeDto"];

/**
 * "Update employment" changes what is true now (the form starts from today's values and sends only what differs). "Add past
 * record" fills in history: the form starts empty and sends only what was filled in, because whatever is left blank carries
 * forward from the stint before that date, which the screen does not know.
 */
export type EmploymentMode = "update" | "past";

/** The department select's value for "leave it as it was", used only when adding a past record. */
export const KEEP = "__keep__";

export type ManagerChoice = { kind: "keep" } | { kind: "none" } | { kind: "person"; id: string; label: string; name: string };

export interface EmploymentDraft {
  effectiveFrom: string;
  designation: string;
  employmentType: "" | EmploymentType;
  workMode: "" | WorkMode;
  salary: string;
  departmentId: string;
  manager: ManagerChoice;
  /** Empty = let the backend work out the reason from what changed. */
  reason: "" | ChangeReason;
  note: string;
}

export function initialDraft(employee: Employee, mode: EmploymentMode): EmploymentDraft {
  if (mode === "past") {
    return {
      effectiveFrom: "",
      designation: "",
      employmentType: "",
      workMode: "",
      salary: "",
      departmentId: KEEP,
      manager: { kind: "keep" },
      reason: "",
      note: "",
    };
  }
  return {
    effectiveFrom: todayInDhaka(),
    designation: employee.designation,
    employmentType: employee.employmentType,
    workMode: employee.workMode,
    salary: employee.salary ?? "",
    departmentId: employee.department?.id ?? "",
    manager: employee.manager
      ? {
          kind: "person",
          id: employee.manager.id,
          label: `${employee.manager.employeeId} · ${employee.manager.fullName}`,
          name: employee.manager.fullName,
        }
      : { kind: "none" },
    reason: "",
    note: "",
  };
}

export interface DraftChanges {
  /** The fields to send. */
  fields: Partial<EmploymentChangeBody>;
  /** One readable line per change, shown before saving. */
  summary: string[];
}

/** What the draft would record, compared with today's values (update) or with nothing (past record). */
export function draftChanges(
  draft: EmploymentDraft,
  employee: Employee,
  mode: EmploymentMode,
  canSeeSensitive: boolean,
  departments: readonly Pick<Department, "id" | "name">[],
): DraftChanges {
  const fields: Partial<EmploymentChangeBody> = {};
  const summary: string[] = [];
  const update = mode === "update";
  const line = (field: StateField, from: string | null, to: string | null) =>
    summary.push(
      update
        ? `${FIELD_LABEL[field]}: ${changeValue(field, from)} → ${changeValue(field, to)}`
        : `${FIELD_LABEL[field]}: ${changeValue(field, to)}`,
    );

  const designation = draft.designation.trim();
  if (designation && (!update || designation !== employee.designation)) {
    fields.designation = designation;
    line("designation", employee.designation, designation);
  }
  if (draft.employmentType && (!update || draft.employmentType !== employee.employmentType)) {
    fields.employmentType = draft.employmentType;
    line("employmentType", employee.employmentType, draft.employmentType);
  }
  if (draft.workMode && (!update || draft.workMode !== employee.workMode)) {
    fields.workMode = draft.workMode;
    line("workMode", employee.workMode, draft.workMode);
  }
  const salary = draft.salary.trim();
  // A salary can be changed but not cleared, and only by someone who may see salaries.
  if (canSeeSensitive && salary && (!update || salary !== (employee.salary ?? ""))) {
    fields.salary = salary;
    line("salary", employee.salary ?? null, salary);
  }

  const nameOf = (id: string | null) =>
    id ? (departments.find((d) => d.id === id)?.name ?? employee.department?.name ?? null) : null;
  if (draft.departmentId !== KEEP) {
    const next = draft.departmentId || null;
    if (!update || next !== (employee.department?.id ?? null)) {
      fields.departmentId = next;
      line("departmentId", employee.department?.name ?? null, nameOf(next));
    }
  }

  if (draft.manager.kind !== "keep") {
    const next = draft.manager.kind === "person" ? draft.manager.id : null;
    if (!update || next !== (employee.manager?.id ?? null)) {
      fields.managerId = next;
      line("managerId", employee.manager?.fullName ?? null, draft.manager.kind === "person" ? draft.manager.name : null);
    }
  }

  if (draft.reason) fields.reason = draft.reason;
  if (draft.note.trim()) fields.note = draft.note.trim();
  return { fields, summary };
}

const AMOUNT = /^\d{1,13}(\.\d{1,2})?$/;

/** Field messages while typing. The backend checks all of it again and its messages are shown the same way. */
export function draftProblems(draft: EmploymentDraft, employee: Employee, mode: EmploymentMode): Record<string, string> {
  const problems: Record<string, string> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.effectiveFrom)) problems.effectiveFrom = "Pick the day the change takes effect";
  else if (draft.effectiveFrom < employee.joinedOn)
    problems.effectiveFrom = `This cannot be before the joining date, ${formatPlainDate(employee.joinedOn)}`;
  else if (employee.leftOn && draft.effectiveFrom > employee.leftOn)
    problems.effectiveFrom = `This cannot be after the leaving date, ${formatPlainDate(employee.leftOn)}`;
  else if (mode === "past" && draft.effectiveFrom > todayInDhaka())
    problems.effectiveFrom = "Pick a day that has passed. Use Update employment for a change that is still ahead";

  const designation = draft.designation.trim();
  if (designation && (designation.length < 2 || designation.length > 80)) problems.designation = "Use 2 to 80 characters";
  const salary = draft.salary.trim();
  if (salary && !AMOUNT.test(salary)) problems.salary = "Use digits with at most two decimals";
  if (draft.note.length > 500) problems.note = "Use 500 characters or fewer";
  return problems;
}

export const employmentTypeOptions = (Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]).map((value) => ({
  value,
  label: EMPLOYMENT_TYPE_LABEL[value],
}));
export const workModeOptions = (Object.keys(WORK_MODE_LABEL) as WorkMode[]).map((value) => ({
  value,
  label: WORK_MODE_LABEL[value],
}));
