"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { Button, Dialog, Field, Input, InlineError, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import type { Department } from "@/lib/hr/employees";

/** Adds a department, or renames / re-describes one. A name is unique in any letter case; the backend says so when it is not. */
export function DepartmentDialog({ department, onClose }: { department?: Department; onClose: () => void }) {
  const router = useRouter();
  const id = useId();
  const [name, setName] = useState(department?.name ?? "");
  const [description, setDescription] = useState(department?.description ?? "");
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const problems: Record<string, string> = {};
  if (name.trim().length < 2) problems.name = "Enter a name of at least 2 characters";
  if (name.trim().length > 80) problems.name = "Use 80 characters or fewer";
  if (description.length > 300) problems.description = "Use 300 characters or fewer";
  const shown = (field: string) => serverErrors[field] ?? (attempted ? problems[field] : undefined);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setFormError(null);
    if (Object.keys(problems).length > 0) return;
    const body = { name: name.trim(), description: description.trim() };
    if (department && body.name === department.name && body.description === department.description)
      return setFormError("Nothing has changed yet.");
    setPending(true);
    try {
      const { response, error } = department
        ? await api.PATCH("/api/v1/hr/departments/{id}", { params: { path: { id: department.id } }, body })
        : await api.POST("/api/v1/hr/departments", { body });
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        const fields = apiFieldErrors(error);
        setServerErrors(fields);
        setFormError(
          response.status === 403
            ? "You do not have permission to do this."
            : Object.keys(fields).length > 0
              ? "Some details need another look. They are marked above."
              : apiMessage(error, "The department could not be saved. Try again."),
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
      title={department ? `Edit ${department.name}` : "Add a department"}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={`${id}-form`} variant="primary" disabled={pending}>
            {pending ? "Saving" : department ? "Save changes" : "Add department"}
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={submit} noValidate>
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-20">
          <Field id={`${id}-name`} label="Name" required error={shown("name")}>
            <Input
              id={`${id}-name`}
              maxLength={80}
              autoComplete="off"
              value={name}
              invalid={Boolean(shown("name"))}
              onChange={(event) => {
                setName(event.target.value);
                setServerErrors({});
              }}
            />
          </Field>
          <Field id={`${id}-description`} label="Description" helper="Optional." error={shown("description")}>
            <Textarea
              id={`${id}-description`}
              maxLength={300}
              className="min-h-80"
              value={description}
              invalid={Boolean(shown("description"))}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
        </fieldset>
        {formError && <InlineError className="mt-12">{formError}</InlineError>}
      </form>
    </Dialog>
  );
}

/** The page's “Add department” button; the dialog is only mounted while it is open. */
export function AddDepartmentButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" icon={<Plus strokeWidth={1.5} />} onClick={() => setOpen(true)}>
        Add department
      </Button>
      {open && <DepartmentDialog onClose={() => setOpen(false)} />}
    </>
  );
}
