import { z } from "zod";

import {
  amountSchema,
  designationSchema,
  EMPLOYMENT_TYPES,
  type EmploymentType,
  normalizeAmount,
  noteSchema,
  WORK_MODES,
  type WorkMode,
} from "./employee";
import { addDays, calculatePeriod, countingEnd, type Period } from "./employment-period";

/** "Joined" is written by the system when an employee is created; everything else is chosen on the Update employment form. */
export const CHANGE_REASONS = [
  "promotion",
  "role_type_change",
  "salary_revision",
  "designation_change",
  "department_transfer",
  "manager_change",
  "work_mode_change",
  "correction",
] as const;
export const EMPLOYMENT_REASONS = ["joined", ...CHANGE_REASONS] as const;
export type EmploymentReason = (typeof EMPLOYMENT_REASONS)[number];
export type ChangeReason = (typeof CHANGE_REASONS)[number];

/** The complete employment state in force during one stint. */
export interface EmploymentState {
  designation: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  /** Decimal string in BDT, or null when never set. */
  salary: string | null;
  departmentId: string | null;
  managerId: string | null;
}

export const STATE_FIELDS = ["designation", "employmentType", "workMode", "salary", "departmentId", "managerId"] as const;
export type StateField = (typeof STATE_FIELDS)[number];

/** Only the fields that change are sent; the rest carry forward from the stint before the effective date. */
export const employmentChangeSchema = z.object({
  /** The day the change took effect. A future day makes it a scheduled change. */
  effectiveFrom: z.iso.date(),
  /** Left out, the reason is worked out from what changed. */
  reason: z.enum(CHANGE_REASONS).optional(),
  note: noteSchema.optional(),
  designation: designationSchema.optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  /** Monthly gross in BDT. Only accepted from someone who may see salaries. */
  salary: amountSchema.optional(),
  departmentId: z.uuid().nullable().optional(),
  managerId: z.uuid().nullable().optional(),
});
export type EmploymentChangeInput = z.infer<typeof employmentChangeSchema>;

/** Takes `base` and replaces every field the change actually sent. */
export function applyChange(base: EmploymentState, change: Partial<EmploymentState>): EmploymentState {
  return {
    designation: change.designation ?? base.designation,
    employmentType: change.employmentType ?? base.employmentType,
    workMode: change.workMode ?? base.workMode,
    salary: change.salary !== undefined ? change.salary : base.salary,
    departmentId: change.departmentId !== undefined ? change.departmentId : base.departmentId,
    managerId: change.managerId !== undefined ? change.managerId : base.managerId,
  };
}

function same(field: StateField, a: EmploymentState, b: EmploymentState): boolean {
  if (field === "salary") return normalizeAmount(a.salary) === normalizeAmount(b.salary);
  return a[field] === b[field];
}

/** The fields whose value differs between two states. */
export function changedFields(before: EmploymentState, after: EmploymentState): StateField[] {
  return STATE_FIELDS.filter((field) => !same(field, before, after));
}

/**
 * The reason that fits what changed, for when the caller did not choose one. A new designation is a promotion; otherwise the
 * most specific single change wins. The person can always override it.
 */
export function suggestReason(fields: readonly StateField[]): ChangeReason {
  if (fields.includes("designation")) return "promotion";
  if (fields.includes("employmentType")) return "role_type_change";
  if (fields.includes("departmentId")) return "department_transfer";
  if (fields.includes("salary")) return "salary_revision";
  if (fields.includes("managerId")) return "manager_change";
  if (fields.includes("workMode")) return "work_mode_change";
  return "correction";
}

/** A message when a record cannot take effect on that day, otherwise null. */
export function effectiveDateProblem(input: { effectiveFrom: string; joinedOn: string; leftOn: string | null }): string | null {
  if (input.effectiveFrom < input.joinedOn) return "The change cannot take effect before the joining date";
  if (input.leftOn !== null && input.effectiveFrom > input.leftOn) return "The change cannot take effect after the leaving date";
  return null;
}

export interface TimelineRecord extends EmploymentState {
  id: string;
  effectiveFrom: string;
  reason: EmploymentReason;
}

export type BlockStatus = "past" | "current" | "scheduled";

export interface FieldChange {
  field: StateField;
  from: EmploymentState[StateField];
  to: EmploymentState[StateField];
}

export interface TimelineBlock<T extends TimelineRecord> {
  record: T;
  /** The last day of this stint: the day before the next one starts, or the leaving date. Null = still running ("Present"). */
  endsOn: string | null;
  status: BlockStatus;
  /** How long the stint lasted or has lasted so far. Null for a scheduled one. */
  period: Period | null;
  /** What differs from the stint before. Empty for the first one. */
  changes: FieldChange[];
}

/**
 * Turns records (oldest first) into timeline blocks: each stint runs until the next begins. The stint in force is the newest one
 * dated on or before `today`. Its length is counted up to today, or up to the leaving date once that has passed.
 */
export function buildTimeline<T extends TimelineRecord>(
  recordsAsc: readonly T[],
  leftOn: string | null,
  today: string,
): TimelineBlock<T>[] {
  let currentIndex = -1;
  recordsAsc.forEach((record, index) => {
    if (record.effectiveFrom <= today) currentIndex = index;
  });
  const runningUntil = countingEnd(leftOn, today);

  return recordsAsc.map((record, index) => {
    const next = recordsAsc[index + 1];
    const previous = recordsAsc[index - 1];
    const status: BlockStatus = record.effectiveFrom > today ? "scheduled" : index === currentIndex ? "current" : "past";
    const periodEnd = next ? next.effectiveFrom : runningUntil;
    return {
      record,
      endsOn: next ? addDays(next.effectiveFrom, -1) : leftOn,
      status,
      period: status === "scheduled" ? null : calculatePeriod(record.effectiveFrom, periodEnd),
      changes: previous
        ? changedFields(previous, record).map((field) => ({ field, from: previous[field], to: record[field] }))
        : [],
    };
  });
}
