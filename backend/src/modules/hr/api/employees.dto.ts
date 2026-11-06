import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { createDepartmentSchema, listDepartmentsQuerySchema, updateDepartmentSchema } from "../domain/department";
import {
  createEmployeeSchema,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  EXIT_TYPES,
  leaveSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
  WORK_MODES,
} from "../domain/employee";
import { EMPLOYMENT_REASONS, employmentChangeSchema, STATE_FIELDS } from "../domain/employment-record";

const iso = z.iso.datetime();
const date = z.iso.date();

// `.nullable()` on a response field comes out as an array type in openapi.json (a nestjs-zod quirk), so spell the union out.
const orNull = <T extends z.ZodType>(schema: T) => z.union([schema, z.null()]);

// A pattern keeps this a plain string in openapi.json.
const amountString = z.string().regex(/^\d+(\.\d+)?$/);

// A bare nullable string at the top of a DTO comes out as an array type in openapi.json, so a pattern that matches any text keeps it a plain string (the same trick the recruitment DTOs use for amounts).
const text = z.string().regex(/^[\s\S]*$/);

const period = z.object({
  years: z.number().int(),
  months: z.number().int(),
  days: z.number().int(),
  /** Exact days, for sorting or a tooltip. */
  totalDays: z.number().int(),
});

const departmentRef = z.object({ id: z.uuid(), name: z.string() });
const managerRef = z.object({ id: z.uuid(), employeeId: z.string(), fullName: z.string() });

const employeeSummary = z.object({
  id: z.uuid(),
  employeeNo: z.number().int(),
  /** `EMP-0001`. */
  employeeId: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  /** `leaving` = serving notice, `upcoming` = joins in the future. */
  status: z.enum(EMPLOYEE_STATUSES),
  joinedOn: date,
  leftOn: orNull(date),
  designation: z.string(),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
  department: orNull(departmentRef),
  manager: orNull(managerRef),
  /** Joining date up to today, or up to the leaving date once the employee has left. */
  period,
});

const employeeList = z.object({
  items: z.array(employeeSummary),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

const change = z.object({
  field: z.enum(STATE_FIELDS),
  /** Readable values: a department or manager by name, a salary as an amount. Null = none. */
  from: orNull(text),
  to: orNull(text),
});

const timelineBlock = z.object({
  id: z.uuid(),
  effectiveFrom: date,
  /** The last day of this stint. Null = still running ("Present"). */
  endsOn: orNull(date),
  status: z.enum(["past", "current", "scheduled"]),
  reason: z.enum(EMPLOYMENT_REASONS),
  note: orNull(text),
  /** Null for a scheduled stint. */
  period: orNull(period),
  designation: z.string(),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
  /** Absent unless the caller holds `hr.sensitive.read`. */
  salary: orNull(amountString).optional(),
  department: orNull(departmentRef),
  manager: orNull(managerRef),
  /** What differs from the stint before; empty for the first one. */
  changes: z.array(change),
  recordedBy: orNull(text),
  createdAt: iso,
});

const employeeDetail = employeeSummary.extend({
  address: z.string(),
  /** The full NID with `hr.sensitive.read`, otherwise only the last four digits. */
  nid: z.string(),
  nidMasked: z.boolean(),
  /** Absent unless the caller holds `hr.sensitive.read`. */
  salary: orNull(amountString).optional(),
  exitType: orNull(z.enum(EXIT_TYPES)),
  exitNote: orNull(text),
  createdAt: iso,
  updatedAt: iso,
  directReports: z.array(z.object({ id: z.uuid(), employeeId: z.string(), fullName: z.string(), designation: z.string() })),
  /** Newest first. */
  timeline: z.array(timelineBlock),
});

const department = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  active: z.boolean(),
  /** People in it today, not counting those who have left. */
  employeeCount: z.number().int(),
  createdAt: iso,
  updatedAt: iso,
});

export class CreateEmployeeDto extends createZodDto(createEmployeeSchema) {}
export class UpdateEmployeeDto extends createZodDto(updateEmployeeSchema) {}
export class ListEmployeesQueryDto extends createZodDto(listEmployeesQuerySchema) {}
export class EmploymentChangeDto extends createZodDto(employmentChangeSchema) {}
export class LeaveDto extends createZodDto(leaveSchema) {}
export class EmployeeIdParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
export class EmploymentRecordParamsDto extends createZodDto(z.object({ id: z.uuid(), recordId: z.uuid() })) {}

export class EmployeeDto extends createZodDto(employeeDetail) {}
export class EmployeeListDto extends createZodDto(employeeList) {}
export class DesignationListDto extends createZodDto(z.object({ designations: z.array(z.string()) })) {}

export class CreateDepartmentDto extends createZodDto(createDepartmentSchema) {}
export class UpdateDepartmentDto extends createZodDto(updateDepartmentSchema) {}
export class ListDepartmentsQueryDto extends createZodDto(listDepartmentsQuerySchema) {}
export class DepartmentIdParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
export class DepartmentDto extends createZodDto(department) {}
export class DepartmentListDto extends createZodDto(z.object({ items: z.array(department) })) {}
