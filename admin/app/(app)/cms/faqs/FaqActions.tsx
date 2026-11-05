"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Dialog } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import { FAQ_PAGES, faqHref, type FaqStatus } from "@/lib/cms/faqs";

type Action = "publish" | "unpublish" | "delete";

/**
 * Edit, Publish / Unpublish and Delete for one FAQ, each behind a dialog that says what will change. `row` is the small version
 * for the list (with an Edit link); `header` is the full-size version on the FAQ's own page (where Delete returns to the list).
 * Unlike a testimonial or a case study, an FAQ can be deleted in any state, so Delete says when it is live. Only with the
 * matching permission; the backend checks it again.
 */
export function FaqActions({
  faq,
  canUpdate,
  canDelete,
  variant,
}: {
  faq: { id: string; question: string; status: FaqStatus };
  canUpdate: boolean;
  canDelete: boolean;
  variant: "row" | "header";
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Action | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const size = variant === "row" ? "sm" : "md";
  const live = faq.status === "published";

  function open(action: Action) {
    setError(null);
    setDialog(action);
  }

  async function run(action: Action) {
    setPending(true);
    setError(null);
    try {
      const path = { params: { path: { id: faq.id } } };
      const { response, error: failure } =
        action === "publish"
          ? await api.POST("/api/v1/cms/faqs/{id}/publish", path)
          : action === "unpublish"
            ? await api.POST("/api/v1/cms/faqs/{id}/unpublish", path)
            : await api.DELETE("/api/v1/cms/faqs/{id}", path);
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setError(
          response.status === 403
            ? "You do not have permission to do this."
            : response.status === 404
              ? "This FAQ no longer exists. Reload the list."
              : apiMessage(failure, "That did not work. Try again."),
        );
        return;
      }
      setDialog(null);
      if (action === "delete" && variant === "header") router.replace("/cms/faqs");
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
  const cancel = (
    <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
      Cancel
    </Button>
  );

  return (
    <>
      {variant === "row" && (
        <Button href={faqHref(faq.id)} size={size} icon={<Pencil strokeWidth={1.5} />} aria-label={`Edit “${faq.question}”`}>
          Edit
        </Button>
      )}
      {canUpdate && faq.status === "draft" && (
        <Button
          variant={variant === "header" ? "primary" : "outline"}
          size={size}
          aria-label={`Publish “${faq.question}”`}
          onClick={() => open("publish")}
        >
          Publish
        </Button>
      )}
      {canUpdate && live && (
        <Button variant="outline" size={size} aria-label={`Unpublish “${faq.question}”`} onClick={() => open("unpublish")}>
          Unpublish
        </Button>
      )}
      {canDelete && (
        <Button variant="outline" size={size} aria-label={`Delete “${faq.question}”`} onClick={() => open("delete")}>
          Delete
        </Button>
      )}

      <Dialog
        open={dialog === "publish"}
        onClose={() => setDialog(null)}
        title={`Publish “${faq.question}”?`}
        actions={
          <>
            {cancel}
            <Button variant="primary" onClick={() => run("publish")} disabled={pending}>
              {pending ? "Publishing" : "Publish"}
            </Button>
          </>
        }
      >
        <p>
          The question and answer will appear in the FAQ section on the website ({FAQ_PAGES}) within about a minute. You can
          unpublish it later.
        </p>
        {failure}
      </Dialog>

      <Dialog
        open={dialog === "unpublish"}
        onClose={() => setDialog(null)}
        title={`Unpublish “${faq.question}”?`}
        actions={
          <>
            {cancel}
            <Button variant="dark" onClick={() => run("unpublish")} disabled={pending}>
              {pending ? "Unpublishing" : "Unpublish"}
            </Button>
          </>
        }
      >
        <p>It will disappear from the website within about a minute. It stays here as a draft, and you can publish it again.</p>
        {failure}
      </Dialog>

      <Dialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title={`Delete “${faq.question}”?`}
        actions={
          <>
            {cancel}
            <Button variant="dark" onClick={() => run("delete")} disabled={pending}>
              {pending ? "Deleting" : "Delete FAQ"}
            </Button>
          </>
        }
      >
        <p>
          {live
            ? `This FAQ is live. It will be removed from the website (${FAQ_PAGES}) within about a minute and permanently deleted. This cannot be undone.`
            : "This permanently deletes the FAQ. This cannot be undone."}
        </p>
        {failure}
      </Dialog>
    </>
  );
}
