"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, ConfirmDialog } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import { formatNumber } from "@/lib/format";

/**
 * Deletes an employee record made by mistake, with its timeline and documents. Anyone who actually worked here is marked as left
 * instead, so the history is kept; the dialog says so. The backend refuses when other people's history names this employee as
 * their manager, and that message is shown in the dialog.
 */
export function DeleteEmployeeButton({
  id,
  name,
  entries,
  documents,
}: {
  id: string;
  name: string;
  /** Timeline entries that go with the record. */
  entries: number;
  /** Documents that go with the record, or null when this person cannot see them. */
  documents: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    try {
      const { response, error: failure } = await api.DELETE("/api/v1/hr/employees/{id}", { params: { path: { id } } });
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setError(
          response.status === 403
            ? "You do not have permission to do this."
            : apiMessage(failure, "That did not work. Try again."),
        );
        return;
      }
      router.push("/hr/employees");
      router.refresh();
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const entryText = `${formatNumber(entries)} timeline ${entries === 1 ? "entry" : "entries"}`;
  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Delete employee
      </Button>
      {open && (
        <ConfirmDialog
          open
          destructive
          onClose={() => setOpen(false)}
          title={`Delete ${name}?`}
          confirmLabel="Delete employee"
          pendingLabel="Deleting"
          pending={pending}
          error={error}
          onConfirm={run}
        >
          <p>
            This permanently removes the record, its {entryText}
            {documents === null
              ? ", and any documents with their files"
              : documents > 0
                ? ` and ${formatNumber(documents)} document${documents === 1 ? "" : "s"} with their files`
                : ""}
            . It cannot be undone.
          </p>
          <p className="mt-12">
            Use this only for a record created by mistake. Someone who worked here should be marked as left, which keeps their
            history.
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}
