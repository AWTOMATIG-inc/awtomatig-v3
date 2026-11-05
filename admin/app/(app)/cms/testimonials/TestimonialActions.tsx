"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Dialog } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import { testimonialHref, type TestimonialStatus } from "@/lib/cms/testimonials";

type Action = "publish" | "unpublish" | "delete";

/**
 * Edit, Publish / Unpublish and Delete for one testimonial, each behind a dialog that says what will change. `row` is the small
 * version for the list (with an Edit link); `header` is the full-size version on the testimonial's own page (where Delete
 * returns to the list). Publish needs the client's agreement to be recorded; Delete is offered for drafts only, because a live
 * testimonial must be unpublished first. Only with the matching permission; the backend checks it again.
 */
export function TestimonialActions({
  testimonial,
  canUpdate,
  canDelete,
  variant,
}: {
  testimonial: { id: string; name: string; company: string; status: TestimonialStatus; consentConfirmed: boolean };
  canUpdate: boolean;
  canDelete: boolean;
  variant: "row" | "header";
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Action | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const size = variant === "row" ? "sm" : "md";
  const who = `${testimonial.name}, ${testimonial.company}`;

  function open(action: Action) {
    setError(null);
    setDialog(action);
  }

  async function run(action: Action) {
    setPending(true);
    setError(null);
    try {
      const path = { params: { path: { id: testimonial.id } } };
      const { response, error: failure } =
        action === "publish"
          ? await api.POST("/api/v1/cms/testimonials/{id}/publish", path)
          : action === "unpublish"
            ? await api.POST("/api/v1/cms/testimonials/{id}/unpublish", path)
            : await api.DELETE("/api/v1/cms/testimonials/{id}", path);
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setError(
          response.status === 403
            ? "You do not have permission to do this."
            : response.status === 404
              ? "This testimonial no longer exists. Reload the list."
              : apiMessage(failure, "That did not work. Try again."),
        );
        return;
      }
      setDialog(null);
      if (action === "delete" && variant === "header") router.replace("/cms/testimonials");
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
        <Button
          href={testimonialHref(testimonial.id)}
          size={size}
          icon={<Pencil strokeWidth={1.5} />}
          aria-label={`Edit ${testimonial.name}`}
        >
          Edit
        </Button>
      )}
      {canUpdate && testimonial.status === "draft" && (
        <Button
          variant={variant === "header" ? "primary" : "outline"}
          size={size}
          disabled={!testimonial.consentConfirmed}
          title={testimonial.consentConfirmed ? undefined : "Record the client's agreement first"}
          aria-label={`Publish ${testimonial.name}`}
          onClick={() => open("publish")}
        >
          Publish
        </Button>
      )}
      {canUpdate && testimonial.status === "published" && (
        <Button variant="outline" size={size} aria-label={`Unpublish ${testimonial.name}`} onClick={() => open("unpublish")}>
          Unpublish
        </Button>
      )}
      {canDelete && testimonial.status === "draft" && (
        <Button variant="outline" size={size} aria-label={`Delete ${testimonial.name}`} onClick={() => open("delete")}>
          Delete
        </Button>
      )}

      <Dialog
        open={dialog === "publish"}
        onClose={() => setDialog(null)}
        title={`Publish the testimonial from ${who}?`}
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
          The quote, name, role and company will appear in the “Client testimonials” section on the website&apos;s Home and About
          pages within about a minute. You can unpublish it later.
        </p>
        {failure}
      </Dialog>

      <Dialog
        open={dialog === "unpublish"}
        onClose={() => setDialog(null)}
        title={`Unpublish the testimonial from ${who}?`}
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
          It will disappear from the Home and About pages within about a minute. It stays here as a draft, and you can publish it
          again.
        </p>
        {failure}
      </Dialog>

      <Dialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title={`Delete the testimonial from ${who}?`}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="dark" onClick={() => run("delete")} disabled={pending}>
              {pending ? "Deleting" : "Delete testimonial"}
            </Button>
          </>
        }
      >
        <p>This permanently deletes the testimonial and its logo. This cannot be undone.</p>
        {failure}
      </Dialog>
    </>
  );
}
