"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { Button, ConfirmDialog, Dialog, Field, Input, InlineError, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import { todayInDhaka } from "@/lib/hr/dates";
import { EXIT_TYPE_LABEL, EXIT_TYPES, type Employee, type ExitType } from "@/lib/hr/employees";
import { formatPlainDate } from "@/lib/format";

import { EmployeePicker, type PersonRef } from "../EmployeePicker";

type Handover = "" | "none" | "person";

/**
 * Marks the employee as leaving on a date (which may still be ahead: a notice period). The period and the last timeline entry
 * stop on that day; history and documents are kept. If people report to the employee, the dialog makes the person say who takes
 * over before it will save, so nobody is left reporting to someone who has gone.
 */
function LeaveDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const router = useRouter();
  const id = useId();
  const reports = employee.directReports;
  const [leftOn, setLeftOn] = useState(todayInDhaka());
  const [exitType, setExitType] = useState<ExitType>("resigned");
  const [exitNote, setExitNote] = useState("");
  const [handover, setHandover] = useState<Handover>("");
  const [picked, setPicked] = useState<PersonRef | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const problems: Record<string, string> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(leftOn)) problems.leftOn = "Pick the last day of work";
  else if (leftOn < employee.joinedOn)
    problems.leftOn = `This cannot be before the joining date, ${formatPlainDate(employee.joinedOn)}`;
  if (exitNote.length > 500) problems.exitNote = "Use 500 characters or fewer";
  if (reports.length > 0) {
    if (handover === "") problems.reassignReportsTo = "Choose who takes over";
    else if (handover === "person" && !picked) problems.reassignReportsTo = "Choose a person, or pick No manager";
  }
  const shown = (field: string) => serverErrors[field] ?? (attempted ? problems[field] : undefined);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setFormError(null);
    if (Object.keys(problems).length > 0) return;
    setPending(true);
    try {
      const { response, error } = await api.POST("/api/v1/hr/employees/{id}/leave", {
        params: { path: { id: employee.id } },
        body: {
          leftOn,
          exitType,
          ...(exitNote.trim() ? { exitNote: exitNote.trim() } : {}),
          ...(reports.length > 0 ? { reassignReportsTo: handover === "person" ? picked!.id : null } : {}),
        },
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
              : apiMessage(error, "That did not work. Try again."),
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

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Mark ${employee.fullName} as left`}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={`${id}-form`} variant="dark" disabled={pending}>
            {pending ? "Saving" : "Mark as left"}
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={submit} noValidate>
        <p className="text-fg-muted">
          Their employment period and the last timeline entry stop on the last day of work. Their history and documents are kept.
          A day still ahead means they are serving notice until then.
        </p>
        <fieldset disabled={pending} className="mt-16 flex min-w-0 flex-col gap-20">
          <Field id={`${id}-date`} label="Last day of work" required error={shown("leftOn")}>
            <Input
              id={`${id}-date`}
              type="date"
              min={employee.joinedOn}
              value={leftOn}
              invalid={Boolean(shown("leftOn"))}
              onChange={(event) => {
                setLeftOn(event.target.value);
                setServerErrors({});
              }}
            />
          </Field>
          <Field id={`${id}-type`} label="Reason for leaving" required>
            <Select id={`${id}-type`} value={exitType} onChange={(event) => setExitType(event.target.value as ExitType)}>
              {EXIT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {EXIT_TYPE_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`${id}-note`} label="Note" helper="Optional." error={shown("exitNote")}>
            <Textarea
              id={`${id}-note`}
              maxLength={500}
              className="min-h-80"
              value={exitNote}
              invalid={Boolean(shown("exitNote"))}
              onChange={(event) => setExitNote(event.target.value)}
            />
          </Field>

          {reports.length > 0 && (
            <div className="border-border rounded-8 border p-12">
              <p className="type-body-14 text-fg-strong font-medium">
                {reports.length === 1 ? "1 person reports" : `${reports.length} people report`} to {employee.fullName}
              </p>
              <ul className="text-fg-muted mt-4">
                {reports.map((report) => (
                  <li key={report.id}>
                    {report.employeeId} · {report.fullName}
                  </li>
                ))}
              </ul>
              <div className="mt-16">
                <Field id={`${id}-handover`} label="Who takes over" required error={shown("reassignReportsTo")}>
                  <Select
                    id={`${id}-handover`}
                    value={handover}
                    onChange={(event) => {
                      setHandover(event.target.value as Handover);
                      setServerErrors({});
                    }}
                  >
                    <option value="">Choose…</option>
                    <option value="person">A person</option>
                    <option value="none">No manager</option>
                  </Select>
                </Field>
                {handover === "person" && (
                  <div className="mt-8">
                    <EmployeePicker id={`${id}-successor`} value={picked} onChange={setPicked} excludeId={employee.id} />
                  </div>
                )}
                <p className="text-fg-muted mt-6">Each of them gets a “Manager change” entry on the last day of work.</p>
              </div>
            </div>
          )}
        </fieldset>
        {formError && <InlineError className="mt-12">{formError}</InlineError>}
      </form>
    </Dialog>
  );
}

/** Undoes a mistaken “Mark as left”. Anything recorded meanwhile stays. */
function ReinstateDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    try {
      const { response, error: failure } = await api.POST("/api/v1/hr/employees/{id}/reinstate", {
        params: { path: { id: employee.id } },
      });
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setError(
          response.status === 403
            ? "You do not have permission to do this."
            : apiMessage(failure, "That did not work. Try again."),
        );
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={`Reinstate ${employee.fullName}?`}
      confirmLabel="Reinstate"
      pendingLabel="Reinstating"
      pending={pending}
      error={error}
      onConfirm={run}
    >
      <p>
        This clears the leaving date{employee.leftOn ? ` (${formatPlainDate(employee.leftOn)})` : ""}, so their employment period
        runs to today again. Use it when someone was marked as left by mistake. People who were handed to a new manager when they
        left stay with that manager.
      </p>
    </ConfirmDialog>
  );
}

/** “Mark as left” for someone who works here, “Reinstate” for someone marked as left. */
export function LeaveControls({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const left = employee.leftOn !== null;
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {left ? "Reinstate" : "Mark as left"}
      </Button>
      {open &&
        (left ? (
          <ReinstateDialog employee={employee} onClose={() => setOpen(false)} />
        ) : (
          <LeaveDialog employee={employee} onClose={() => setOpen(false)} />
        ))}
    </>
  );
}
