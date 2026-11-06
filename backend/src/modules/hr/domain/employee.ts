import { z } from "zod";

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contractual", "internship"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODES = ["onsite", "hybrid", "remote"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EXIT_TYPES = ["resigned", "terminated", "contract_ended", "internship_ended", "retired", "other"] as const;
export type ExitType = (typeof EXIT_TYPES)[number];

/** `upcoming` = the joining date is still ahead; `leaving` = a leaving date is set but has not come yet. */
export const EMPLOYEE_STATUSES = ["active", "leaving", "left", "upcoming"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

/** What the list shows by default: everyone still working, including someone serving notice. */
export const EMPLOYEE_LIST_FILTERS = ["working", "left", "upcoming", "all"] as const;
export const EMPLOYEE_SORT_FIELDS = ["fullName", "employeeNo", "joinedOn", "designation"] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

/** The permission that unlocks salaries and the full NID. Without it the API sends neither. */
export const SENSITIVE_PERMISSION = "hr.sensitive.read";

const EMPLOYEE_ID_PREFIX = "EMP-";
const EMPLOYEE_ID_WIDTH = 4;

/** `7` becomes `EMP-0007`. The number simply grows past four digits. */
export function formatEmployeeId(employeeNo: number): string {
  return `${EMPLOYEE_ID_PREFIX}${String(employeeNo).padStart(EMPLOYEE_ID_WIDTH, "0")}`;
}

/** Reads `EMP-0007`, `emp0007` or `emp-7` as 7. Returns null for anything else. */
export function parseEmployeeId(text: string): number | null {
  const match = /^emp-?(\d{1,9})$/i.exec(text.trim());
  return match ? Number(match[1]) : null;
}

/** Keeps the last four digits: `*********6789`. */
export function maskNid(nid: string): string {
  return `${"*".repeat(Math.max(nid.length - 4, 0))}${nid.slice(-4)}`;
}

/** Bangladesh national ID numbers are 10, 13 (old) or 17 digits long. */
export const NID_PATTERN = /^(\d{10}|\d{13}|\d{17})$/;

/** Drops trailing zeros so `15000.0000` from the database and `15000` from a form compare equal. */
export function normalizeAmount(value: string | null): string | null {
  if (value === null) return null;
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}

/** Salary arrives as a decimal string so it is never a JS float. Up to 13 digits fits numeric(19,4) with room to spare. */
export const amountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,13}(\.\d{1,2})?$/, "Use digits with at most two decimals");

export const DESIGNATION_MAX_LENGTH = 80;
export const designationSchema = z.string().trim().min(2).max(DESIGNATION_MAX_LENGTH);
export const noteSchema = z.string().trim().max(500);

const personalFields = {
  fullName: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .max(200)
    .pipe(z.email())
    .transform((value) => value.toLowerCase()),
  // Staff may have foreign numbers, so this only checks the shape. Recruitment's stricter Bangladesh rule is not reused (modules
  // do not import each other).
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d[\d\s\-().]{6,24}$/, "Enter a valid phone number"),
  address: z.string().trim().min(1).max(300),
  nid: z.string().trim().regex(NID_PATTERN, "Enter a 10, 13 or 17 digit NID number"),
};

export const createEmployeeSchema = z.object({
  ...personalFields,
  joinedOn: z.iso.date(),
  designation: designationSchema,
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
  /** Monthly gross in BDT. Only accepted from someone who may see salaries; left unset otherwise. */
  salary: amountSchema.nullable().default(null),
  departmentId: z.uuid().nullable().default(null),
  managerId: z.uuid().nullable().default(null),
  note: noteSchema.optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

/** Personal details and the joining date. Employment details change through the timeline, never here. */
export const updateEmployeeSchema = z
  .object({ ...personalFields, joinedOn: z.iso.date() })
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: "Send at least one field to change" });
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  status: z.enum(EMPLOYEE_LIST_FILTERS).default("working"),
  departmentId: z.uuid().optional(),
  managerId: z.uuid().optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  workMode: z.enum(WORK_MODES).optional(),
  sort: z.enum(EMPLOYEE_SORT_FIELDS).default("fullName"),
  order: z.enum(["asc", "desc"]).default("asc"),
});
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

export const leaveSchema = z.object({
  /** The last day of employment. May be in the future (notice period). */
  leftOn: z.iso.date(),
  exitType: z.enum(EXIT_TYPES),
  exitNote: noteSchema.optional(),
  /**
   * Who takes over the people who report to this employee. A person's id, or `null` for nobody. Required when the employee has
   * direct reports, so nobody is left reporting to someone who has gone.
   */
  reassignReportsTo: z.uuid().nullable().optional(),
});
export type LeaveInput = z.infer<typeof leaveSchema>;

/** Escapes `%`, `_` and `\` so a search term is matched literally by `ILIKE`. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
