"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImagePicker } from "@/components/cms/ImagePicker";
import { Button, Card, CardHeader, Field, Input } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import type { CaseStudy } from "@/lib/cms/case-studies";
import { ALT_MAX_LENGTH, altProblem, uploadCaseStudyImage } from "@/lib/cms/image";

/**
 * The showcase image of a saved case study: the current picture, a file to replace it with, and its description. Uploading a
 * new file replaces the old one on the website (the old file is deleted once the new one is saved); the description can also
 * be changed on its own. Only with `cms.case_study.update`; the backend checks it again.
 */
export function ShowcaseImage({ study, canUpdate }: { study: CaseStudy; canUpdate: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  // Changing the key empties the picker after a successful upload.
  const [pickerKey, setPickerKey] = useState(0);
  const [alt, setAlt] = useState(study.image?.alt ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [altError, setAltError] = useState<string | null>(null);

  const image = study.image;
  const altChanged = alt.trim() !== (image?.alt ?? "");
  const canSave = canUpdate && (file !== null || (image !== null && altChanged));

  async function save() {
    setMessage(null);
    setFailure(null);
    const problem = altProblem(alt);
    setAltError(problem);
    if (problem) return;

    setPending(true);
    try {
      if (file) {
        const upload = await uploadCaseStudyImage(study.id, file, alt);
        if (!upload.ok) return setFailure(upload.message);
        setFile(null);
        setPickerKey((key) => key + 1);
        setMessage(image ? "Image replaced." : "Image saved.");
      } else {
        const { response, error } = await api.PATCH("/api/v1/cms/case-studies/{id}", {
          params: { path: { id: study.id } },
          body: { imageAlt: alt.trim() },
        });
        if (response.status === 401) return router.replace("/login");
        if (!response.ok) {
          return setFailure(
            response.status === 403
              ? "You do not have permission to do this."
              : apiMessage(error, "The description could not be saved."),
          );
        }
        setMessage("Description saved.");
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card aria-labelledby="showcase-title">
      <CardHeader
        id="showcase-title"
        title="Showcase image"
        subtitle="Used on both the Home page and the Case Studies page. A new image replaces the old one."
      />
      <div className="grid gap-20 p-20 md:grid-cols-[320px_1fr]">
        <ImagePicker
          key={pickerKey}
          current={image}
          onFile={setFile}
          disabled={pending}
          readOnly={!canUpdate}
          hint="PNG, JPEG or WebP, up to 5 MB. About 551 × 525 px works best; the website rounds the corners."
        />
        <div className="max-w-520">
          <Field
            id="showcaseAlt"
            label="Image description"
            required
            helper="For people who cannot see the picture, for example “Tour website homepage on a tablet”."
            error={altError ?? undefined}
          >
            <Input
              id="showcaseAlt"
              maxLength={ALT_MAX_LENGTH}
              value={alt}
              disabled={!canUpdate || pending}
              invalid={Boolean(altError)}
              onChange={(event) => setAlt(event.target.value)}
            />
          </Field>
          {canUpdate && (
            <div className="mt-16 flex flex-wrap items-center gap-12">
              <Button variant="outline" disabled={!canSave || pending} onClick={save}>
                {pending ? "Saving" : file ? (image ? "Replace image" : "Upload image") : "Save description"}
              </Button>
              <p role="status" className="type-body-14 text-fg-muted">
                {message}
              </p>
            </div>
          )}
          {failure && (
            <p role="alert" className="type-body-14 text-fg-primary mt-12 flex items-start gap-8">
              <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
              {failure}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
