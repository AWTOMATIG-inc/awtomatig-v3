"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { Button, Dialog, Field, Input, InlineError, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import { todayInDhaka } from "@/lib/hr/dates";
import {
  type EmploymentDraft,
  type EmploymentMode,
  draftChanges,
  draftProblems,
  employmentTypeOptions,
  initialDraft,
  KEEP,
  type ManagerChoice,
  workModeOptions,
} from "@/lib/hr/employment-form";
import { CHANGE_REASONS, type Department, type Employee, REASON_LABEL } from "@/lib/hr/employees";

import { EmployeePicker, type PersonRef } from "../EmployeePicker";

type ManagerMode = "keep" | "none" | "person";

interface Shared {
  employee: Employee;
  departments: readonly Pick<Department, "id" | "name">[];
  designations: readonly string[];
  canSeeSensitive: boolean;
}

/**
 * Records a change to an employee's employment details as one new timeline entry. "Update employment" starts from today's
 * values and sends only what differs; "Add past record" starts empty and sends only what was filled in (see `EmploymentMode`).
 * It says in plain words what will be recorded before saving. The backend checks everything again and its messages are shown
 * next to the field they belong to.
 */
function EmploymentDialog({
  employee,
  departments,
  designations,
  canSeeSensitive,
  mode,
  onClose,
}: Shared & { mode: EmploymentMode; onClose: () => void }) {
  const router = useRouter();
  const id = useId();
  const update = mode === "update";
  const initial = initialDraft(employee, mode);
  const [draft, setDraft] = useState<EmploymentDraft>(initial);
  const [managerMode, setManagerMode] = useState<ManagerMode>(initial.manager.kind);
  const [picked, setPicked] = useState<PersonRef | null>(
    initial.manager.kind === "person"
      ? { id: initial.manager.id, label: initial.manager.label, name: initial.manager.name }
      : null,
  );
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Choosing "A person" without choosing one yet changes nothing, and is pointed out when the person tries to save.
  const manager: ManagerChoice =
    managerMode === "person" ? (picked ? { kind: "person", ...picked } : { kind: "keep" }) : { kind: managerMode };
  const current: EmploymentDraft = { ...draft, manager };
  const { fields, summary } = draftChanges(current, employee, mode, canSeeSensitive, departments);
  const problems = draftProblems(current, employee, mode);
  const managerUnchosen = managerMode === "person" && !picked;
  const set = (patch: Partial<EmploymentDraft>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    setServerErrors({});
  };
  const shown = (field: string) => serverErrors[field] ?? (attempted ? problems[field] : undefined);

  // The employee's own department stays selectable even if it has since been deactivated.
  const departmentOptions =
    employee.department && !departments.some((department) => department.id === employee.department?.id)
      ? [...departments, employee.department]
      : departments;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setFormError(null);
    if (Object.keys(problems).length > 0 || managerUnchosen || summary.length === 0) return;
    setPending(true);
    try {
      const { response, error } = await api.POST("/api/v1/hr/employees/{id}/employment-changes", {
        params: { path: { id: employee.id } },
        body: { effectiveFrom: draft.effectiveFrom, ...fields },
      });
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        const fieldErrors = apiFieldErrors(error);
        setServerErrors(fieldErrors);
        setFormError(
          response.status === 403
            ? "You do not have permission to do this."
            : Object.keys(fieldErrors).length > 0
              ? "Some details need another look. They are marked above."
              : apiMessage(error, "The change could not be saved. Try again."),
        );
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const keepOption = !update && <option value="">Keep what it was</option>;
  const designationListId = `${id}-designations`;

  return (
    <Dialog
      open
      wide
      onClose={onClose}
      title={update ? `Update employment for ${employee.fullName}` : `Add a past record for ${employee.fullName}`}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={`${id}-form`} variant="primary" disabled={pending || summary.length === 0}>
            {pending ? "Saving" : update ? "Record change" : "Add record"}
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={submit} noValidate>
        <p className="text-fg-muted">
          {update
            ? "Change what is different. Everything you leave as it is stays the same. A date in the future schedules the change."
            : "For history that was never recorded. Fill in only what changed on that day; anything left blank stays as it was just before."}
        </p>
        <fieldset disabled={pending} className="mt-16 grid min-w-0 gap-20 sm:grid-cols-2">
          <Field
            id={`${id}-date`}
            label="Effective from"
            required
            helper={update ? "The day the change takes effect." : "The day the change took effect."}
            error={shown("effectiveFrom")}
          >
            <Input
              id={`${id}-date`}
              type="date"
              min={employee.joinedOn}
              max={
                update
                  ? (employee.leftOn ?? undefined)
                  : employee.leftOn && employee.leftOn < todayInDhaka()
                    ? employee.leftOn
                    : todayInDhaka()
              }
              value={draft.effectiveFrom}
              invalid={Boolean(shown("effectiveFrom"))}
              onChange={(event) => set({ effectiveFrom: event.target.value })}
            />
          </Field>
          <Field id={`${id}-reason`} label="Reason" helper="Left alone, it is worked out from what changed.">
            <Select
              id={`${id}-reason`}
              value={draft.reason}
              onChange={(event) => set({ reason: event.target.value as EmploymentDraft["reason"] })}
            >
              <option value="">Work it out from what changed</option>
              {CHANGE_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {REASON_LABEL[reason]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id={`${id}-designation`} label="Designation" error={shown("designation")}>
            <Input
              id={`${id}-designation`}
              list={designationListId}
              maxLength={80}
              autoComplete="off"
              placeholder={update ? undefined : "Keep what it was"}
              value={draft.designation}
              invalid={Boolean(shown("designation"))}
              onChange={(event) => set({ designation: event.target.value })}
            />
            <datalist id={designationListId}>
              {designations.map((designation) => (
                <option key={designation} value={designation} />
              ))}
            </datalist>
          </Field>
          <Field id={`${id}-type`} label="Role type">
            <Select
              id={`${id}-type`}
              value={draft.employmentType}
              onChange={(event) => set({ employmentType: event.target.value as EmploymentDraft["employmentType"] })}
            >
              {keepOption}
              {employmentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`${id}-mode`} label="Work mode">
            <Select
              id={`${id}-mode`}
              value={draft.workMode}
              onChange={(event) => set({ workMode: event.target.value as EmploymentDraft["workMode"] })}
            >
              {keepOption}
              {workModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          {canSeeSensitive ? (
            <Field
              id={`${id}-salary`}
              label="Salary (BDT, per month)"
              helper={update ? undefined : "Leave blank to keep what it was."}
              error={shown("salary")}
            >
              <Input
                id={`${id}-salary`}
                inputMode="decimal"
                autoComplete="off"
                value={draft.salary}
                invalid={Boolean(shown("salary"))}
                onChange={(event) => set({ salary: event.target.value })}
              />
            </Field>
          ) : (
            <p className="type-body-14 text-fg-muted self-end">Salaries are changed by someone with permission to view them.</p>
          )}
          <Field id={`${id}-department`} label="Department" error={shown("departmentId")}>
            <Select
              id={`${id}-department`}
              value={draft.departmentId}
              onChange={(event) => set({ departmentId: event.target.value })}
            >
              {!update && <option value={KEEP}>Keep what it was</option>}
              <option value="">No department</option>
              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <Field
              id={`${id}-manager-mode`}
              label="Manager"
              error={shown("managerId") ?? (attempted && managerUnchosen ? "Choose a person, or pick No manager" : undefined)}
            >
              <Select
                id={`${id}-manager-mode`}
                value={managerMode}
                onChange={(event) => {
                  setManagerMode(event.target.value as ManagerMode);
                  setServerErrors({});
                }}
              >
                {!update && <option value="keep">Keep what it was</option>}
                <option value="none">No manager</option>
                <option value="person">A person</option>
              </Select>
            </Field>
            {managerMode === "person" && (
              <div className="mt-8">
                <EmployeePicker id={`${id}-manager`} value={picked} onChange={setPicked} excludeId={employee.id} />
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <Field id={`${id}-note`} label="Note" helper="Optional. Shown on the timeline." error={shown("note")}>
              <Textarea
                id={`${id}-note`}
                maxLength={500}
                className="min-h-80"
                value={draft.note}
                invalid={Boolean(shown("note"))}
                onChange={(event) => set({ note: event.target.value })}
              />
            </Field>
          </div>
        </fieldset>

        <div className="bg-surface-subtle rounded-8 mt-20 p-12" aria-live="polite">
          <p className="type-caption-12 text-fg-muted uppercase">What will be recorded</p>
          {summary.length === 0 ? (
            <p className="mt-4">Nothing yet. Change at least one detail.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {summary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
        {shown("form") && <InlineError className="mt-12">{shown("form")}</InlineError>}
        {formError && <InlineError className="mt-12">{formError}</InlineError>}
      </form>
    </Dialog>
  );
}

/** A button that opens the dialog. The dialog is only mounted while open, so it starts fresh every time. */
export function EmploymentButton({
  mode,
  variant,
  ...shared
}: Shared & { mode: EmploymentMode; variant: "primary" | "outline" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={mode === "past" ? "sm" : "md"} onClick={() => setOpen(true)}>
        {mode === "update" ? "Update employment" : "Add past record"}
      </Button>
      {open && <EmploymentDialog {...shared} mode={mode} onClose={() => setOpen(false)} />}
    </>
  );
}
