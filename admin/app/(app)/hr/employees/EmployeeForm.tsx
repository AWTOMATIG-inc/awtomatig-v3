"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Path, useForm, useWatch } from "react-hook-form";

import { Button, Card, CardHeader, Field, Input, InlineError, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import { calculatePeriod, todayInDhaka } from "@/lib/hr/dates";
import { createEmployeeFormSchema, type EmployeeFormValues, toCreateBody } from "@/lib/hr/employee-form";
import {
  EMPLOYMENT_TYPE_LABEL,
  EMPLOYMENT_TYPES,
  employeeHref,
  formatPeriod,
  WORK_MODE_LABEL,
  WORK_MODES,
} from "@/lib/hr/employees";

import { EmployeePicker, type PersonRef } from "./EmployeePicker";

/** The live line under the joining date: how long that is up to today, or that it is still ahead. */
function periodHint(joinedOn: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(joinedOn)) return undefined;
  const today = todayInDhaka();
  if (joinedOn > today) return "Starts in the future. The employee shows as “Starts later” until that day.";
  return `${formatPeriod(calculatePeriod(joinedOn, today))} so far. This is calculated; it is never typed.`;
}

/**
 * Adds an employee: personal details, then where they sit and what they do. Saving writes the person and their first timeline
 * entry ("Joined") together; documents are added on the profile afterwards. Validation here is for feedback only: the backend
 * repeats it, and its messages (a duplicate email or NID, a bad manager) are shown next to the field they belong to.
 */
export function EmployeeForm({
  departments,
  designations,
  canSeeSensitive,
}: {
  departments: readonly { id: string; name: string }[];
  designations: readonly string[];
  canSeeSensitive: boolean;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [manager, setManager] = useState<PersonRef | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(createEmployeeFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      nid: "",
      joinedOn: todayInDhaka(),
      designation: "",
      employmentType: "full_time",
      workMode: "onsite",
      salary: "",
      departmentId: "",
      managerId: "",
    },
  });
  const joinedOn = useWatch({ control, name: "joinedOn" });

  async function save(values: EmployeeFormValues) {
    setFormError(null);
    try {
      const { data, response, error } = await api.POST("/api/v1/hr/employees", {
        body: toCreateBody({ ...values, managerId: manager?.id ?? "" }, canSeeSensitive),
      });
      if (response.status === 401) return router.replace("/login");
      if (!data) {
        const fieldErrors = apiFieldErrors(error);
        let placed = 0;
        for (const [path, message] of Object.entries(fieldErrors)) {
          // A manager problem belongs to the picker, which is not a registered field.
          if (path === "managerId") {
            setFormError(message);
            placed += 1;
          } else {
            setError(path as Path<EmployeeFormValues>, { message });
            placed += 1;
          }
        }
        if (response.status === 403) return setFormError("You do not have permission to do this.");
        if (placed === 0) setFormError(apiMessage(error, "The employee could not be saved. Try again."));
        else if (!fieldErrors.managerId) setFormError("Some details need another look. They are marked above.");
        return;
      }
      router.push(employeeHref(data.id));
      router.refresh();
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
    }
  }

  const grid = "grid gap-20 p-20 sm:grid-cols-2";
  const describe = (key: keyof EmployeeFormValues) => (errors[key] ? `${key}-error` : undefined);

  return (
    <form onSubmit={handleSubmit(save)} noValidate className="flex flex-col gap-20">
      <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-20">
        <Card aria-labelledby="personal-title">
          <CardHeader id="personal-title" title="Personal details" />
          <div className={grid}>
            <div className="sm:col-span-2">
              <Field id="fullName" label="Full name" required error={errors.fullName?.message}>
                <Input
                  id="fullName"
                  maxLength={100}
                  autoComplete="off"
                  invalid={Boolean(errors.fullName)}
                  aria-describedby={describe("fullName")}
                  {...register("fullName")}
                />
              </Field>
            </div>
            <Field id="email" label="Email" required error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                invalid={Boolean(errors.email)}
                aria-describedby={describe("email")}
                {...register("email")}
              />
            </Field>
            <Field id="phone" label="Phone" required error={errors.phone?.message}>
              <Input
                id="phone"
                type="tel"
                autoComplete="off"
                invalid={Boolean(errors.phone)}
                aria-describedby={describe("phone")}
                {...register("phone")}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field id="address" label="Address" required error={errors.address?.message}>
                <Textarea
                  id="address"
                  rows={3}
                  maxLength={300}
                  className="min-h-80"
                  invalid={Boolean(errors.address)}
                  aria-describedby={describe("address")}
                  {...register("address")}
                />
              </Field>
            </div>
            <Field id="nid" label="NID number" required helper="10, 13 or 17 digits." error={errors.nid?.message}>
              <Input
                id="nid"
                inputMode="numeric"
                autoComplete="off"
                invalid={Boolean(errors.nid)}
                aria-describedby={describe("nid")}
                {...register("nid")}
              />
            </Field>
          </div>
        </Card>

        <Card aria-labelledby="employment-title">
          <CardHeader
            id="employment-title"
            title="Employment"
            subtitle="This becomes the first entry of the career timeline. Later changes are recorded there too."
          />
          <div className={grid}>
            <Field id="joinedOn" label="Joining date" required helper={periodHint(joinedOn)} error={errors.joinedOn?.message}>
              <Input
                id="joinedOn"
                type="date"
                invalid={Boolean(errors.joinedOn)}
                aria-describedby={describe("joinedOn")}
                {...register("joinedOn")}
              />
            </Field>
            <Field id="designation" label="Designation" required error={errors.designation?.message}>
              <Input
                id="designation"
                list="designation-options"
                maxLength={80}
                autoComplete="off"
                invalid={Boolean(errors.designation)}
                aria-describedby={describe("designation")}
                {...register("designation")}
              />
              <datalist id="designation-options">
                {designations.map((designation) => (
                  <option key={designation} value={designation} />
                ))}
              </datalist>
            </Field>
            <Field id="employmentType" label="Role type" required error={errors.employmentType?.message}>
              <Select id="employmentType" invalid={Boolean(errors.employmentType)} {...register("employmentType")}>
                {EMPLOYMENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {EMPLOYMENT_TYPE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="workMode" label="Work mode" required error={errors.workMode?.message}>
              <Select id="workMode" invalid={Boolean(errors.workMode)} {...register("workMode")}>
                {WORK_MODES.map((value) => (
                  <option key={value} value={value}>
                    {WORK_MODE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="departmentId" label="Department" error={errors.departmentId?.message}>
              <Select id="departmentId" {...register("departmentId")}>
                <option value="">No department yet</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div>
              <label htmlFor="manager" className="type-body-14 text-fg-strong mb-6 block font-medium">
                Manager
              </label>
              <EmployeePicker id="manager" value={manager} onChange={setManager} />
            </div>
            {canSeeSensitive ? (
              <Field
                id="salary"
                label="Salary (BDT, per month)"
                helper="Gross, before deductions. Leave empty if it is not decided yet."
                error={errors.salary?.message}
              >
                <Input
                  id="salary"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="25000"
                  invalid={Boolean(errors.salary)}
                  aria-describedby={describe("salary")}
                  {...register("salary")}
                />
              </Field>
            ) : (
              <p className="type-body-14 text-fg-muted self-end">
                Salaries are set by someone with permission to view them. Ask them to add it after saving.
              </p>
            )}
          </div>
        </Card>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-12">
        {formError && <InlineError className="mr-auto">{formError}</InlineError>}
        <Button href="/hr/employees" variant="outline">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving" : "Add employee"}
        </Button>
      </div>
    </form>
  );
}
