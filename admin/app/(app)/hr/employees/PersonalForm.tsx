"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type Path, useForm } from "react-hook-form";

import { Button, Card, CardHeader, Field, Input, InlineError, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import { type PersonalFormValues, personalFormSchema, toPersonalValues, toUpdateBody } from "@/lib/hr/employee-form";
import { type Employee, employeeHref } from "@/lib/hr/employees";

/**
 * Edits the personal details and the joining date. Employment details (designation, role type, salary, department, manager) are
 * not here on purpose: they change through "Update employment" so every change reaches the career timeline. Only what changed is
 * sent. Without permission to see the NID the field is not shown and the NID is never sent.
 */
export function PersonalForm({ employee, canSeeSensitive }: { employee: Employee; canSeeSensitive: boolean }) {
  const router = useRouter();
  const schema = useMemo(() => personalFormSchema({ canSeeSensitive }), [canSeeSensitive]);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PersonalFormValues>({ resolver: zodResolver(schema), defaultValues: toPersonalValues(employee) });

  async function save(values: PersonalFormValues) {
    setFormError(null);
    const body = toUpdateBody(values, employee, canSeeSensitive);
    if (Object.keys(body).length === 0) return setFormError("Nothing has changed yet.");
    try {
      const { data, response, error } = await api.PATCH("/api/v1/hr/employees/{id}", {
        params: { path: { id: employee.id } },
        body,
      });
      if (response.status === 401) return router.replace("/login");
      if (!data) {
        let placed = 0;
        for (const [path, message] of Object.entries(apiFieldErrors(error))) {
          setError(path as Path<PersonalFormValues>, { message });
          placed += 1;
        }
        setFormError(
          response.status === 403
            ? "You do not have permission to do this."
            : placed > 0
              ? "Some details need another look. They are marked above."
              : apiMessage(error, "The details could not be saved. Try again."),
        );
        return;
      }
      router.push(employeeHref(employee.id));
      router.refresh();
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
    }
  }

  const describe = (key: keyof PersonalFormValues) => (errors[key] ? `${key}-error` : undefined);

  return (
    <form onSubmit={handleSubmit(save)} noValidate className="flex flex-col gap-20">
      <fieldset disabled={isSubmitting} className="min-w-0">
        <Card aria-labelledby="personal-title">
          <CardHeader
            id="personal-title"
            title="Personal details"
            subtitle="Role type, designation, salary, department and manager change through Update employment, so they are recorded on the timeline."
          />
          <div className="grid gap-20 p-20 sm:grid-cols-2">
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
            {canSeeSensitive && (
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
            )}
            <Field
              id="joinedOn"
              label="Joining date"
              required
              helper="Must be before the first change on the timeline. The Joined entry moves with it."
              error={errors.joinedOn?.message}
            >
              <Input
                id="joinedOn"
                type="date"
                invalid={Boolean(errors.joinedOn)}
                aria-describedby={describe("joinedOn")}
                {...register("joinedOn")}
              />
            </Field>
          </div>
        </Card>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-12">
        {formError && <InlineError className="mr-auto">{formError}</InlineError>}
        <Button href={employeeHref(employee.id)} variant="outline">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
