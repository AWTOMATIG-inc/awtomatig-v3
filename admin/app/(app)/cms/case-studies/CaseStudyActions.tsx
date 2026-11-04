"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Dialog } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import { caseStudyHref, type CaseStudyStatus } from "@/lib/cms/case-studies";

type Action = "publish" | "unpublish" | "delete";

/**
 * Edit, Publish / Unpublish and Delete for one case study, each behind a dialog that says what will change. `row` is the small
 * version for the list (with an Edit link); `header` is the full-size version on the study's own page (where Delete returns to
 * the list). Delete is offered for drafts only: a live study must be unpublished first. Only with the matching permission;
 * the backend checks it again.
 */
export function CaseStudyActions({
  study,
  canUpdate,
  canDelete,
  variant,
}: {
  study: { id: string; title: string; status: CaseStudyStatus; hasImage: boolean };
  canUpdate: boolean;
  canDelete: boolean;
  variant: "row" | "header";
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Action | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const size = variant === "row" ? "sm" : "md";

  function open(action: Action) {
    setError(null);
    setDialog(action);
  }

  async function run(action: Action) {
    setPending(true);
    setError(null);
    try {
      const path = { params: { path: { id: study.id } } };
      const { response, error: failure } =
        action === "publish"
          ? await api.POST("/api/v1/cms/case-studies/{id}/publish", path)
          : action === "unpublish"
            ? await api.POST("/api/v1/cms/case-studies/{id}/unpublish", path)
            : await api.DELETE("/api/v1/cms/case-studies/{id}", path);
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setError(
          response.status === 403
            ? "You do not have permission to do this."
            : response.status === 404
              ? "This case study no longer exists. Reload the list."
              : apiMessage(failure, "That did not work. Try again."),
        );
        return;
      }
      setDialog(null);
      if (action === "delete" && variant === "header") router.replace("/cms/case-studies");
      router.refresh();
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  const failure = error && (
    <p role="alert" className="text-fg-primary mt-12 flex items-start gap-8">
      <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
      {error}
    </p>
  );

  return (
    <>
      {variant === "row" && (
        <Button href={caseStudyHref(study.id)} size={size} icon={<Pencil strokeWidth={1.5} />} aria-label={`Edit ${study.title}`}>
          Edit
        </Button>
      )}
      {canUpdate && study.status === "draft" && (
        <Button
          variant={variant === "header" ? "primary" : "outline"}
          size={size}
          disabled={!study.hasImage}
          title={study.hasImage ? undefined : "Upload the showcase image first"}
          aria-label={`Publish ${study.title}`}
          onClick={() => open("publish")}
        >
          Publish
        </Button>
      )}
      {canUpdate && study.status === "published" && (
        <Button variant="outline" size={size} aria-label={`Unpublish ${study.title}`} onClick={() => open("unpublish")}>
          Unpublish
        </Button>
      )}
      {canDelete && study.status === "draft" && (
        <Button variant="outline" size={size} aria-label={`Delete ${study.title}`} onClick={() => open("delete")}>
          Delete
        </Button>
      )}

      <Dialog
        open={dialog === "publish"}
        onClose={() => setDialog(null)}
        title={`Publish “${study.title}”?`}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => run("publish")} disabled={pending}>
              {pending ? "Publishing" : "Publish"}
            </Button>
          </>
        }
      >
        <p>
          It will appear on the website&apos;s Home page and Case Studies page within about a minute. You can unpublish it later.
        </p>
        {failure}
      </Dialog>

      <Dialog
        open={dialog === "unpublish"}
        onClose={() => setDialog(null)}
        title={`Unpublish “${study.title}”?`}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="dark" onClick={() => run("unpublish")} disabled={pending}>
              {pending ? "Unpublishing" : "Unpublish"}
            </Button>
          </>
        }
      >
        <p>
          It will disappear from the Home page and the Case Studies page within about a minute, and its own page will stop
          working. It stays here as a draft, and you can publish it again.
        </p>
        {failure}
      </Dialog>

      <Dialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title={`Delete “${study.title}”?`}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="dark" onClick={() => run("delete")} disabled={pending}>
              {pending ? "Deleting" : "Delete case study"}
            </Button>
          </>
        }
      >
        <p>This permanently deletes the case study and its image. This cannot be undone.</p>
        {failure}
      </Dialog>
    </>
  );
}
