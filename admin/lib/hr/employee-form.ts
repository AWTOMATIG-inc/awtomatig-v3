import { z } from "zod";

import type { components } from "@/lib/api/schema";

import type { Employee, EmploymentType, WorkMode } from "./employees";

export type CreateEmployeeBody = components["schemas"]["CreateEmployeeDto"];
export type UpdateEmployeeBody = components["schemas"]["UpdateEmployeeDto"];

/** Everything is a string in the form, like the inputs: money in particular is never turned into a JS number. */
export interface EmployeeFormValues {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  nid: string;
  joinedOn: string;
  designation: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  salary: string;
  /** A department's id, or empty for none. */
  departmentId: string;
  /** An employee's id, or empty for none. The picker keeps the name for display. */
  managerId: string;
}

const amount = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{1,13}(\.\d{1,2})?$/.test(value), "Use digits with at most two decimals");

/** The checks that give feedback while typing. The backend repeats all of them and has the final word. */
const personalShape = {
  fullName: z.string().trim().min(2, "Enter the full name").max(100, "Use 100 characters or fewer"),
  email: z
    .string()
    .trim()
    .min(1, "Enter the email address")
    .max(200, "Use 200 characters or fewer")
    .pipe(z.email("Enter a valid email address")),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d[\d\s\-().]{6,24}$/, "Enter a valid phone number, for example 01712345678"),
  address: z.string().trim().min(1, "Enter the address").max(300, "Use 300 characters or fewer"),
  nid: z
    .string()
    .trim()
    .regex(/^(\d{10}|\d{13}|\d{17})$/, "Enter a 10, 13 or 17 digit NID number"),
  joinedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the joining date"),
};

export const createEmployeeFormSchema = z.object({
  ...personalShape,
  designation: z.string().trim().min(2, "Enter the designation").max(80, "Use 80 characters or fewer"),
  employmentType: z.enum(["full_time", "part_time", "contractual", "internship"]),
  workMode: z.enum(["onsite", "hybrid", "remote"]),
  salary: amount,
  departmentId: z.string(),
  managerId: z.string(),
});

export type PersonalFormValues = Pick<EmployeeFormValues, "fullName" | "email" | "phone" | "address" | "nid" | "joinedOn">;

/** Without permission to see the NID the field is not shown, so it is not checked either. */
export function personalFormSchema(options: { canSeeSensitive: boolean }) {
  return z.object({ ...personalShape, nid: options.canSeeSensitive ? personalShape.nid : z.string() });
}

export function toCreateBody(values: EmployeeFormValues, canSeeSensitive: boolean): CreateEmployeeBody {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    address: values.address.trim(),
    nid: values.nid.trim(),
    joinedOn: values.joinedOn,
    designation: values.designation.trim(),
    employmentType: values.employmentType,
    workMode: values.workMode,
    // Only someone who may see salaries can set one; the backend refuses it from anyone else.
    salary: canSeeSensitive && values.salary.trim() ? values.salary.trim() : null,
    departmentId: values.departmentId || null,
    managerId: values.managerId || null,
  };
}

export function toPersonalValues(employee: Employee): PersonalFormValues {
  return {
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    // A masked NID is never put in a field to be saved back.
    nid: employee.nidMasked ? "" : employee.nid,
    joinedOn: employee.joinedOn,
  };
}

/** Only what changed, so an untouched field never overwrites anything. The NID is left out unless the person may see it. */
export function toUpdateBody(values: PersonalFormValues, employee: Employee, canSeeSensitive: boolean): UpdateEmployeeBody {
  const initial = toPersonalValues(employee);
  const body: UpdateEmployeeBody = {};
  const changed = (key: keyof PersonalFormValues) => values[key].trim() !== initial[key];
  if (changed("fullName")) body.fullName = values.fullName.trim();
  if (changed("email")) body.email = values.email.trim();
  if (changed("phone")) body.phone = values.phone.trim();
  if (changed("address")) body.address = values.address.trim();
  if (canSeeSensitive && changed("nid")) body.nid = values.nid.trim();
  if (changed("joinedOn")) body.joinedOn = values.joinedOn;
  return body;
}
