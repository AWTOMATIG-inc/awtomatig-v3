import type { components } from "@/lib/api/schema";
import { formatAmount, formatMoney } from "@/lib/format";

export type Employee = components["schemas"]["EmployeeDto"];
export type EmployeeSummary = components["schemas"]["EmployeeListDto"]["items"][number];
export type TimelineBlock = Employee["timeline"][number];
export type EmployeeStatus = Employee["status"];
export type EmploymentType = Employee["employmentType"];
export type WorkMode = Employee["workMode"];
export type ExitType = NonNullable<Employee["exitType"]>;
export type TimelineReason = TimelineBlock["reason"];
export type ChangeReason = NonNullable<components["schemas"]["EmploymentChangeDto"]["reason"]>;
export type StateField = TimelineBlock["changes"][number]["field"];
export type Period = Employee["period"];
export type Department = components["schemas"]["DepartmentDto"];

export const EMPLOYMENT_TYPES: readonly EmploymentType[] = ["full_time", "part_time", "contractual", "internship"];
export const WORK_MODES: readonly WorkMode[] = ["onsite", "hybrid", "remote"];
export const EXIT_TYPES: readonly ExitType[] = [
  "resigned",
  "terminated",
  "contract_ended",
  "internship_ended",
  "retired",
  "other",
];
export const CHANGE_REASONS: readonly ChangeReason[] = [
  "promotion",
  "role_type_change",
  "salary_revision",
  "designation_change",
  "department_transfer",
  "manager_change",
  "work_mode_change",
  "correction",
];

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contractual: "Contractual",
  internship: "Internship",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = { onsite: "Onsite", hybrid: "Hybrid", remote: "Remote" };

/** `leaving` = serving notice (a leaving date is set but has not come), `upcoming` = joins in the future. */
export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: "Active",
  leaving: "Serving notice",
  left: "Left",
  upcoming: "Starts later",
};

export const EXIT_TYPE_LABEL: Record<ExitType, string> = {
  resigned: "Resigned",
  terminated: "Terminated",
  contract_ended: "Contract ended",
  internship_ended: "Internship ended",
  retired: "Retired",
  other: "Other",
};

export const REASON_LABEL: Record<TimelineReason, string> = {
  joined: "Joined",
  promotion: "Promotion",
  role_type_change: "Role type change",
  salary_revision: "Salary revision",
  designation_change: "Designation change",
  department_transfer: "Department transfer",
  manager_change: "Manager change",
  work_mode_change: "Work mode change",
  correction: "Correction",
};

export const FIELD_LABEL: Record<StateField, string> = {
  designation: "Designation",
  employmentType: "Role type",
  workMode: "Work mode",
  salary: "Salary",
  departmentId: "Department",
  managerId: "Manager",
};

/** A value from a timeline change, in words. A salary is an amount; a department or manager arrives as a name already. */
export function changeValue(field: StateField, value: string | null): string {
  if (value === null || value === "") return "None";
  if (field === "employmentType") return EMPLOYMENT_TYPE_LABEL[value as EmploymentType] ?? value;
  if (field === "workMode") return WORK_MODE_LABEL[value as WorkMode] ?? value;
  if (field === "salary") return formatAmount(value);
  return value;
}

export const salaryText = (amount: string) => formatMoney(amount, "BDT");

/**
 * A length of time in words. Every non-zero part is shown by default ("2 years, 3 months, 12 days"); `compact` stops after the
 * two biggest parts, for a table cell.
 */
export function formatPeriod(period: Pick<Period, "years" | "months" | "days">, options?: { compact?: boolean }): string {
  const unit = (count: number, name: string) => `${count} ${name}${count === 1 ? "" : "s"}`;
  const all = [
    period.years > 0 ? unit(period.years, "year") : null,
    period.months > 0 ? unit(period.months, "month") : null,
    period.days > 0 ? unit(period.days, "day") : null,
  ].filter((part): part is string => part !== null);
  if (all.length === 0) return "Less than a day";
  return (options?.compact ? all.slice(0, 2) : all).join(", ");
}

export const EMPLOYEES_PAGE_SIZE = 20;

export type EmployeeListFilter = "working" | "left" | "upcoming" | "all";
export type EmployeeSort = "fullName" | "employeeNo" | "joinedOn" | "designation";
export const LIST_FILTERS: readonly EmployeeListFilter[] = ["working", "left", "upcoming", "all"];
export const EMPLOYEE_SORTS: readonly EmployeeSort[] = ["fullName", "employeeNo", "joinedOn", "designation"];

export const LIST_FILTER_LABEL: Record<EmployeeListFilter, string> = {
  working: "Working now",
  left: "Left",
  upcoming: "Starts later",
  all: "Everyone",
};

export interface EmployeeListParams {
  page: number;
  q?: string;
  status: EmployeeListFilter;
  departmentId?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  sort: EmployeeSort;
  order: "asc" | "desc";
}

export type RawParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reads the list's filters from the page URL, ignoring anything that is not a valid value. */
export function parseEmployeeParams(raw: RawParams): EmployeeListParams {
  const page = Number.parseInt(first(raw.page) ?? "1", 10);
  const q = first(raw.q)?.trim().slice(0, 100);
  const departmentId = first(raw.departmentId);
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    q: q || undefined,
    status: LIST_FILTERS.find((value) => value === first(raw.status)) ?? "working",
    departmentId: departmentId && UUID.test(departmentId) ? departmentId : undefined,
    employmentType: EMPLOYMENT_TYPES.find((value) => value === first(raw.employmentType)),
    workMode: WORK_MODES.find((value) => value === first(raw.workMode)),
    sort: EMPLOYEE_SORTS.find((value) => value === first(raw.sort)) ?? "fullName",
    order: first(raw.order) === "desc" ? "desc" : "asc",
  };
}

/** The list's URL for some filters, leaving out the defaults so links stay short. */
export function employeesHref(params: EmployeeListParams): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status !== "working") query.set("status", params.status);
  if (params.departmentId) query.set("departmentId", params.departmentId);
  if (params.employmentType) query.set("employmentType", params.employmentType);
  if (params.workMode) query.set("workMode", params.workMode);
  if (params.sort !== "fullName") query.set("sort", params.sort);
  if (params.order !== "asc") query.set("order", params.order);
  if (params.page > 1) query.set("page", String(params.page));
  const text = query.toString();
  return text ? `/hr/employees?${text}` : "/hr/employees";
}

export const employeeHref = (id: string) => `/hr/employees/${id}`;
export const employeeEditHref = (id: string) => `/hr/employees/${id}/edit`;
