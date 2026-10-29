"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Select, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api/client";
import { type LeadStatus, LEAD_STATUSES, STATUS_LABEL, statusTone } from "@/lib/crm/leads";

/**
 * The status of one lead inside the list. With `crm.lead.update` it is a dropdown that saves as soon as a value is picked
 * (and puts the old value back if the save fails); without it, a plain badge. The backend checks the permission again.
 */
export function LeadStatusSelect({
  id,
  name,
  status: initial,
  canUpdate,
}: {
  id: string;
  name: string;
  status: LeadStatus;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canUpdate) return <StatusBadge tone={statusTone(initial)}>{STATUS_LABEL[initial]}</StatusBadge>;

  function change(next: LeadStatus) {
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      try {
        const { response } = await api.PATCH("/api/v1/crm/leads/{id}", { params: { path: { id } }, body: { status: next } });
        if (response.status === 401) return router.replace("/login");
        if (!response.ok) {
          setStatus(previous);
          return setError(response.status === 403 ? "No permission" : "Not saved");
        }
        router.refresh();
      } catch {
        setStatus(previous);
        setError("Not saved");
      }
    });
  }

  return (
    <div className="flex items-center gap-8">
      <Select
        compact
        aria-label={`Status of ${name}`}
        value={status}
        disabled={pending}
        onChange={(event) => change(event.target.value as LeadStatus)}
      >
        {LEAD_STATUSES.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABEL[value]}
          </option>
        ))}
      </Select>
      {error && (
        <span role="alert" className="type-caption-12 text-fg-primary whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
}
