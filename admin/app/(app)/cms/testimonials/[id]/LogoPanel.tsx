"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImagePicker } from "@/components/cms/ImagePicker";
import { Button, Card, CardHeader, Checkbox, Dialog } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import { uploadTestimonialLogo } from "@/lib/cms/image";
import type { Testimonial } from "@/lib/cms/testimonials";

import { LOGO_HINT } from "../logo-hint";

/**
 * The company logo of a saved testimonial: the current logo previewed on a white card the way the website draws it, a file to
 * replace it with, the "show in black" setting, and a way to remove it (the card then shows the company name). Uploading a new
 * file replaces the old one on the website. Only with `cms.testimonial.update`; the backend checks it again.
 */
export function LogoPanel({ testimonial, canUpdate }: { testimonial: Testimonial; canUpdate: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  // Changing the key empties the picker after a successful upload.
  const [pickerKey, setPickerKey] = useState(0);
  const [inBlack, setInBlack] = useState(testimonial.logoInBlack);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const logo = testimonial.logo;
  const blackChanged = inBlack !== testimonial.logoInBlack;
  const canSave = canUpdate && (file !== null || blackChanged);

  async function save() {
    setMessage(null);
    setFailure(null);
    setPending(true);
    try {
      // The setting first: if the upload then fails, the choice is not lost with it.
      if (blackChanged) {
        const { response, error } = await api.PATCH("/api/v1/cms/testimonials/{id}", {
          params: { path: { id: testimonial.id } },
          body: { logoInBlack: inBlack },
        });
        if (response.status === 401) return router.replace("/login");
        if (!response.ok) {
          return setFailure(
            response.status === 403
              ? "You do not have permission to do this."
              : apiMessage(error, "The setting could not be saved."),
          );
        }
      }
      if (file) {
        const upload = await uploadTestimonialLogo(testimonial.id, file);
        if (!upload.ok) return setFailure(upload.message);
        setFile(null);
        setPickerKey((key) => key + 1);
      }
      setMessage(file ? (logo ? "Logo replaced." : "Logo saved.") : "Saved.");
      router.refresh();
    } catch {
      setFailure("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setFailure(null);
    setMessage(null);
    setPending(true);
    try {
      const { response, error } = await api.DELETE("/api/v1/cms/testimonials/{id}/logo", {
        params: { path: { id: testimonial.id } },
      });
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setFailure(
          response.status === 403
            ? "You do not have permission to do this."
            : apiMessage(error, "The logo could not be removed."),
        );
        return;
      }
      setRemoving(false);
      setFile(null);
      setPickerKey((key) => key + 1);
      setMessage("Logo removed.");
      router.refresh();
    } catch {
      setFailure("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card aria-labelledby="logo-title">
      <CardHeader
        id="logo-title"
        title="Company logo"
        subtitle="Optional. Without one, the card shows the company name instead. A new logo replaces the old one."
      />
      <div className="grid gap-20 p-20 md:grid-cols-[320px_1fr]">
        <ImagePicker
          key={pickerKey}
          variant="logo"
          noun="logo"
          current={logo}
          blackLogo={inBlack}
          onFile={setFile}
          disabled={pending}
          readOnly={!canUpdate}
          hint={LOGO_HINT}
        />
        <div className="max-w-520">
          <Checkbox
            label="Show the logo in black"
            checked={inBlack}
            disabled={!canUpdate || pending}
            onChange={(event) => setInBlack(event.target.checked)}
          />
          <p className="type-body-14 text-fg-muted mt-6">
            Tick this for a white or very light logo, which would be invisible on the white card. A coloured logo ticked this way
            turns fully black.
          </p>
          {canUpdate && (
            <div className="mt-16 flex flex-wrap items-center gap-12">
              <Button variant="outline" disabled={!canSave || pending} onClick={save}>
                {pending ? "Saving" : file ? (logo ? "Replace logo" : "Upload logo") : "Save setting"}
              </Button>
              {logo && (
                <Button variant="outline" disabled={pending} onClick={() => setRemoving(true)}>
                  Remove logo
                </Button>
              )}
              <p role="status" className="type-body-14 text-fg-muted">
                {message}
              </p>
            </div>
          )}
          {failure && !removing && (
            <p role="alert" className="type-body-14 text-fg-primary mt-12 flex items-start gap-8">
              <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
              {failure}
            </p>
          )}
        </div>
      </div>

      <Dialog
        open={removing}
        onClose={() => setRemoving(false)}
        title={`Remove the logo of ${testimonial.company}?`}
        actions={
          <>
            <Button variant="outline" onClick={() => setRemoving(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="dark" onClick={remove} disabled={pending}>
              {pending ? "Removing" : "Remove logo"}
            </Button>
          </>
        }
      >
        <p>
          The logo file is deleted.{" "}
          {testimonial.status === "published"
            ? "On the website the card will show the company name instead, within about a minute."
            : "The card will show the company name instead once the testimonial is published."}
        </p>
        {failure && (
          <p role="alert" className="text-fg-primary mt-12 flex items-start gap-8">
            <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
            {failure}
          </p>
        )}
      </Dialog>
    </Card>
  );
}
