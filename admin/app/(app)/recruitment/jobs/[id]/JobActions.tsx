"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Dialog, Field, Input } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import { formatNumber, formatPlainDate } from "@/lib/format";
import { todayInDhaka } from "@/lib/recruitment/job-form";
import type { Job } from "@/lib/recruitment/jobs";

type Action = "publish" | "close" | "reopen";

/**
 * The buttons that move an opening through its life: publish a draft, close an open one, reopen a closed one. Closing and
 * reopening ask first and say what will change; publishing is one click because the page already shows the draft. Only with
 * `recruitment.job.update`; the backend checks it again.
 */
export function JobActions({ job, canUpdate }: { job: Job; canUpdate: boolean }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"close" | "reopen" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The old deadline is offered again unless it has passed, in which case a new one is needed.
  const deadlineHasPassed = job.deadlineOn < todayInDhaka();
  const [deadline, setDeadline] = useState(deadlineHasPassed ? "" : job.deadlineOn);

  if (!canUpdate) return null;

  async function run(action: Action) {
    setPending(true);
    setError(null);
    try {
      const path = { params: { path: { id: job.id } } };
      const { response, error: failure } =
        action === "publish"
          ? await api.POST("/api/v1/recruitment/jobs/{id}/publish", path)
          : action === "close"
            ? await api.POST("/api/v1/recruitment/jobs/{id}/close", path)
            : await api.POST("/api/v1/recruitment/jobs/{id}/reopen", { ...path, body: deadline ? { deadlineOn: deadline } : {} });
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setError(
          response.status === 403
            ? "You do not have permission to do this."
            : apiMessage(failure, "That did not work. Try again."),
        );
        return;
      }
      setDialog(null);
      router.refresh();
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const waiting = job.applicationCount;
  return (
    <>
      {job.status === "draft" && (
        <Button variant="primary" disabled={pending} onClick={() => run("publish")}>
          {pending ? "Publishing" : "Publish"}
        </Button>
      )}
      {job.status === "open" && (
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setDialog("close");
          }}
        >
          Close opening
        </Button>
      )}
      {job.status === "closed" && (
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setDialog("reopen");
          }}
        >
          Reopen
        </Button>
      )}
      {error && dialog === null && (
        <p role="alert" className="type-body-14 text-fg-primary flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
          {error}
        </p>
      )}

      <Dialog
        open={dialog === "close"}
        onClose={() => setDialog(null)}
        title={`Close “${job.title}”?`}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="dark" onClick={() => run("close")} disabled={pending}>
              {pending ? "Closing" : "Close opening"}
            </Button>
          </>
        }
      >
        <p>
          Candidates will no longer be able to apply, and it disappears from the careers page right away.
          {waiting > 0
            ? ` The ${formatNumber(waiting)} application${waiting === 1 ? "" : "s"} already received stay here.`
            : ""}{" "}
          You can reopen it later.
        </p>
        {error && (
          <p role="alert" className="text-fg-primary mt-12 flex items-start gap-8">
            <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
            {error}
          </p>
        )}
      </Dialog>

      <Dialog
        open={dialog === "reopen"}
        onClose={() => setDialog(null)}
        title={`Reopen “${job.title}”?`}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => run("reopen")} disabled={pending || !deadline}>
              {pending ? "Reopening" : "Reopen"}
            </Button>
          </>
        }
      >
        <p>
          Candidates can apply again through the end of the day you pick.
          {deadlineHasPassed ? ` The old deadline, ${formatPlainDate(job.deadlineOn)}, has passed, so choose a new one.` : ""}
        </p>
        <div className="mt-16">
          <Field id="reopen-deadline" label="Last day to apply" required>
            <Input
              id="reopen-deadline"
              type="date"
              min={todayInDhaka()}
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </Field>
        </div>
        {error && (
          <p role="alert" className="text-fg-primary mt-12 flex items-start gap-8">
            <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
            {error}
          </p>
        )}
      </Dialog>
    </>
  );
}
