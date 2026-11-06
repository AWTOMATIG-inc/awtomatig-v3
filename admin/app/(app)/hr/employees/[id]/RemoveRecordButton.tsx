"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog, IconButton } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";

/**
 * Removes a wrongly added timeline entry. The “Joined” entry never gets this button. The employee's current details follow the
 * entries that remain, so the dialog says what the entry is and that nothing else is edited.
 */
export function RemoveRecordButton({
  employeeId,
  recordId,
  description,
}: {
  employeeId: string;
  recordId: string;
  description: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    try {
      const { response, error: failure } = await api.DELETE("/api/v1/hr/employees/{id}/employment-changes/{recordId}", {
        params: { path: { id: employeeId, recordId } },
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
      setOpen(false);
      router.refresh();
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <IconButton
        label="Remove this entry"
        icon={<Trash2 strokeWidth={1.5} />}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      />
      {open && (
        <ConfirmDialog
          open
          destructive
          onClose={() => setOpen(false)}
          title="Remove this entry?"
          confirmLabel="Remove entry"
          pendingLabel="Removing"
          pending={pending}
          error={error}
          onConfirm={run}
        >
          <p>{description}</p>
          <p className="mt-12">
            Only this entry is removed. The employee&apos;s current details follow the entries that remain, and nothing else on
            the timeline changes.
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}
