"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import { Button, Field, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { type LeadStatus, LEAD_STATUSES, STATUS_LABEL } from "@/lib/crm/leads";

type Saved = { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string };

/**
 * The follow-up card: the lead's status and the team's private notes. It is only editable with `crm.lead.update`; otherwise it
 * shows the same values read-only. The backend checks the permission again on save.
 */
export function LeadEditor({
  id,
  status: initialStatus,
  notes: initialNotes,
  canUpdate,
}: {
  id: string;
  status: LeadStatus;
  notes: string;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [result, setResult] = useState<Saved>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  const dirty = status !== initialStatus || notes.trim() !== initialNotes;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult({ kind: "idle" });
    startTransition(async () => {
      try {
        const { response, error } = await api.PATCH("/api/v1/crm/leads/{id}", {
          params: { path: { id } },
          body: { status, notes },
        });
        if (response.status === 401) return router.replace("/login");
        if (!response.ok) {
          const message = (error as { message?: string } | undefined)?.message;
          return setResult({
            kind: "error",
            message:
              response.status === 403
                ? "You do not have permission to change this inquiry."
                : (message ?? "The changes could not be saved."),
          });
        }
        setResult({ kind: "saved" });
        router.refresh();
      } catch {
        setResult({ kind: "error", message: "Cannot reach the server. Check your connection and try again." });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-20">
      <Field id="status" label="Status">
        <Select
          id="status"
          value={status}
          disabled={!canUpdate}
          onChange={(event) => setStatus(event.target.value as LeadStatus)}
        >
          {LEAD_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABEL[value]}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="notes" label="Notes" helper="Only the team sees these.">
        <Textarea
          id="notes"
          value={notes}
          rows={6}
          maxLength={5000}
          disabled={!canUpdate}
          aria-describedby="notes-helper"
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>
      {canUpdate && (
        <div className="flex flex-wrap items-center gap-12">
          <Button type="submit" variant="primary" disabled={pending || !dirty}>
            {pending ? "Saving" : "Save changes"}
          </Button>
          <p role="status" className="type-body-14 text-fg-muted">
            {result.kind === "saved" && "Saved."}
          </p>
        </div>
      )}
      {result.kind === "error" && (
        <p role="alert" className="type-body-14 text-fg-primary flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
          {result.message}
        </p>
      )}
    </form>
  );
}
