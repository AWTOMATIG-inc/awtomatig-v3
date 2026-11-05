"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type Path, useForm, useWatch } from "react-hook-form";

import { ImagePicker } from "@/components/cms/ImagePicker";
import { Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import { type CaseStudy, caseStudyHref, SERVICE_IDS, SERVICE_LABEL } from "@/lib/cms/case-studies";
import {
  type CaseStudyFormValues,
  caseStudyFormSchema,
  MAX_TAGS,
  slugify,
  STAT_COUNT,
  toCreateBody,
  toFormValues,
  toUpdateBody,
} from "@/lib/cms/case-study-form";
import { ALT_MAX_LENGTH, altProblem, uploadCaseStudyImage } from "@/lib/cms/image";

const describe = (id: string, hasError: boolean) => (hasError ? `${id}-error` : undefined);

/** The element id of the control for a field path the backend reported, for example `stats.1.value` is `stat-value-1`. */
function controlId(path: string): string {
  const stat = /^stats\.(\d+)\.(value|label)$/.exec(path);
  return stat ? `stat-${stat[2]}-${stat[1]}` : path;
}

/**
 * The case study form, for a new study (`study` omitted) and for editing one. A new study is saved as a draft or published at
 * once, and the showcase image is chosen here and uploaded right after the study is created. An existing study is saved in
 * place; its image has its own card on its page. Without permission every field is read-only. Validation here is feedback
 * only: the backend repeats it, and its messages are shown next to the field they belong to.
 */
export function CaseStudyForm({ study, canSubmit }: { study?: CaseStudy; canSubmit: boolean }) {
  const router = useRouter();
  const editing = study !== undefined;
  const schema = useMemo(() => caseStudyFormSchema({ editing }), [editing]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // The image of a new study: chosen here, uploaded after the study exists.
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [altError, setAltError] = useState<string | null>(null);
  // The field to move to after a failed save. The form is disabled while it saves, and a disabled field cannot take focus, so the
  // move waits until the save has finished. Without it the message next to the field would be out of sight, far above the buttons.
  const [focusId, setFocusId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CaseStudyFormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(study) });

  useEffect(() => {
    if (focusId && !isSubmitting) document.getElementById(focusId)?.focus();
  }, [focusId, isSubmitting]);

  // The address preview follows what is typed: the slug if there is one, otherwise the name as the backend will slugify it.
  const [typedSlug, typedTitle] = useWatch({ control, name: ["slug", "title"] });
  const address = typedSlug.trim() || slugify(typedTitle);

  /** Puts the backend's field messages next to their fields; whatever has no field becomes the message under the buttons. */
  function showFailure(error: unknown, status: number) {
    if (status === 409) {
      setError("slug", { message: "This web address is already used by another case study. Change the address or the name." });
      setFocusId("slug");
      setFormError("Some details need another look. They are marked above.");
      return;
    }
    let placed = 0;
    for (const [path, message] of Object.entries(apiFieldErrors(error))) {
      setError(path as Path<CaseStudyFormValues>, { message });
      if (placed === 0) setFocusId(controlId(path));
      placed += 1;
    }
    setFormError(
      status === 403
        ? "You do not have permission to do this."
        : placed > 0
          ? "Some details need another look. They are marked above."
          : apiMessage(error, "The case study could not be saved. Try again."),
    );
  }

  async function create(values: CaseStudyFormValues, publish: boolean) {
    setFormError(null);
    setImageError(null);
    setAltError(null);
    setFocusId(null);
    // Check the image first, so nothing is created that cannot be finished.
    if (publish && !file) return setImageError("Choose the showcase image to publish. A draft can be saved without one.");
    if (file) {
      const problem = altProblem(alt);
      if (problem) {
        setAltError(problem);
        setFocusId("imageAlt");
        return;
      }
    }

    try {
      const { data, response, error } = await api.POST("/api/v1/cms/case-studies", { body: toCreateBody(values) });
      if (response.status === 401) return router.replace("/login");
      if (!data) return showFailure(error, response.status);

      let notice: "image-failed" | "publish-failed" | null = null;
      if (file) {
        const upload = await uploadCaseStudyImage(data.id, file, alt);
        if (!upload.ok) notice = "image-failed";
      }
      if (publish && notice === null) {
        const published = await api.POST("/api/v1/cms/case-studies/{id}/publish", { params: { path: { id: data.id } } });
        if (!published.response.ok) notice = "publish-failed";
      }
      router.push(notice ? `${caseStudyHref(data.id)}?notice=${notice}` : caseStudyHref(data.id));
      router.refresh();
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
    }
  }

  async function update(values: CaseStudyFormValues) {
    if (!study) return;
    setFormError(null);
    setSaved(false);
    setFocusId(null);
    try {
      const { data, response, error } = await api.PATCH("/api/v1/cms/case-studies/{id}", {
        params: { path: { id: study.id } },
        body: toUpdateBody(values),
      });
      if (response.status === 401) return router.replace("/login");
      if (!data) return showFailure(error, response.status);
      reset(toFormValues(data));
      setSaved(true);
      router.refresh();
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
    }
  }

  // An error on the whole list of results is kept under `root` because each row's inputs are registered as `stats.N.field`.
  const statsMessage = errors.stats?.message ?? (errors.stats as { root?: { message?: string } } | undefined)?.root?.message;

  const grid = "grid gap-20 p-20 sm:grid-cols-2";
  const textFields = (name: "title" | "client" | "summary" | "challenge" | "description" | "seoTitle" | "seoDescription") => ({
    invalid: Boolean(errors[name]),
    "aria-describedby": describe(name, Boolean(errors[name])),
    ...register(name),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => (editing ? update(values) : create(values, false)))}
      noValidate
      className="flex flex-col gap-20"
    >
      <fieldset disabled={!canSubmit || isSubmitting} className="flex min-w-0 flex-col gap-20">
        <Card aria-labelledby="details-title">
          <CardHeader id="details-title" title="Details" subtitle="Shown on the Home page and the Case Studies page." />
          <div className={grid}>
            <div className="sm:col-span-2">
              <Field id="title" label="Case study name" required error={errors.title?.message}>
                <Input id="title" maxLength={120} {...textFields("title")} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              {editing ? (
                <p className="type-body-14 text-fg-muted">
                  Web address: <span className="text-fg-primary">/case-studies/{study.slug}</span>. It is fixed once the case
                  study is created.
                </p>
              ) : (
                <Field
                  id="slug"
                  label="Web address"
                  helper={`/case-studies/${address || "…"} · Built from the name. Change it only if you need a different address; it cannot be changed later.`}
                  error={errors.slug?.message}
                >
                  <Input
                    id="slug"
                    maxLength={60}
                    autoComplete="off"
                    placeholder={slugify(typedTitle)}
                    invalid={Boolean(errors.slug)}
                    aria-describedby={describe("slug", Boolean(errors.slug))}
                    {...register("slug")}
                  />
                </Field>
              )}
            </div>
            <Field id="client" label="Client" required error={errors.client?.message}>
              <Input id="client" maxLength={120} {...textFields("client")} />
            </Field>
            <Field id="service" label="Service" required helper="Shown in the “Service:” row." error={errors.service?.message}>
              <Select id="service" invalid={Boolean(errors.service)} {...register("service")}>
                {SERVICE_IDS.map((value) => (
                  <option key={value} value={value}>
                    {SERVICE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="category"
              label="Filter tab"
              required
              helper="The tab it appears under on the Case Studies page."
              error={errors.category?.message}
            >
              <Select id="category" invalid={Boolean(errors.category)} {...register("category")}>
                {SERVICE_IDS.map((value) => (
                  <option key={value} value={value}>
                    {SERVICE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="tags"
              label="Tags"
              helper={`Separate with commas. Up to ${MAX_TAGS}, for example: Next.js, Admin Dashboard.`}
              error={errors.tags?.message}
            >
              <Input
                id="tags"
                autoComplete="off"
                invalid={Boolean(errors.tags)}
                aria-describedby={describe("tags", Boolean(errors.tags))}
                {...register("tags")}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field id="summary" label="Summary" required helper="One line under the name." error={errors.summary?.message}>
                <Textarea id="summary" rows={2} maxLength={300} className="min-h-80" {...textFields("summary")} />
              </Field>
            </div>
          </div>
        </Card>

        <Card aria-labelledby="story-title">
          <CardHeader id="story-title" title="The story" subtitle="Plain text." />
          <div className="flex flex-col gap-20 p-20">
            <Field
              id="challenge"
              label="Challenge"
              required
              helper="One or two sentences, shown beside the image on the Case Studies page."
              error={errors.challenge?.message}
            >
              <Textarea id="challenge" rows={3} maxLength={400} {...textFields("challenge")} />
            </Field>
            <Field id="description" label="Description" required error={errors.description?.message}>
              <Textarea id="description" rows={6} maxLength={2000} {...textFields("description")} />
            </Field>
          </div>
        </Card>

        <Card aria-labelledby="results-title">
          <CardHeader
            id="results-title"
            title="Results"
            subtitle={`Shown as a 2 × 2 grid on the Case Studies page. Fill in all ${STAT_COUNT}, or leave all of them empty. Use real figures only.`}
          />
          <div className="flex flex-col gap-16 p-20">
            {Array.from({ length: STAT_COUNT }, (_, index) => (
              <div key={index} className="grid gap-12 sm:grid-cols-[1fr_3fr]">
                <Field
                  id={`stat-value-${index}`}
                  label={`Result ${index + 1}: figure`}
                  error={errors.stats?.[index]?.value?.message}
                >
                  <Input
                    id={`stat-value-${index}`}
                    maxLength={20}
                    autoComplete="off"
                    placeholder="19"
                    invalid={Boolean(errors.stats?.[index]?.value)}
                    {...register(`stats.${index}.value`)}
                  />
                </Field>
                <Field
                  id={`stat-label-${index}`}
                  label={`Result ${index + 1}: label`}
                  error={errors.stats?.[index]?.label?.message}
                >
                  <Input
                    id={`stat-label-${index}`}
                    maxLength={60}
                    autoComplete="off"
                    placeholder="Tour packages online"
                    invalid={Boolean(errors.stats?.[index]?.label)}
                    {...register(`stats.${index}.label`)}
                  />
                </Field>
              </div>
            ))}
            {statsMessage && (
              <p role="alert" className="type-body-14 text-fg-primary flex items-start gap-8">
                <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
                {statsMessage}
              </p>
            )}
          </div>
        </Card>

        <Card aria-labelledby="seo-title">
          <CardHeader
            id="seo-title"
            title="Search engines"
            subtitle="For the case study's own page. Leave empty to use the name and the summary."
          />
          <div className={grid}>
            <div className="sm:col-span-2">
              <Field id="seoTitle" label="Page title" error={errors.seoTitle?.message}>
                <Input id="seoTitle" maxLength={120} {...textFields("seoTitle")} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field id="seoDescription" label="Page description" error={errors.seoDescription?.message}>
                <Textarea id="seoDescription" rows={3} maxLength={300} className="min-h-80" {...textFields("seoDescription")} />
              </Field>
            </div>
          </div>
        </Card>

        {!editing && (
          <Card aria-labelledby="image-title">
            <CardHeader
              id="image-title"
              title="Showcase image"
              subtitle="Uploaded once and used on both the Home page and the Case Studies page. Needed to publish."
            />
            <div className="grid gap-20 p-20 md:grid-cols-[320px_1fr]">
              <ImagePicker
                onFile={setFile}
                disabled={!canSubmit || isSubmitting}
                error={imageError}
                hint="PNG, JPEG or WebP, up to 5 MB. About 551 × 525 px works best; the website rounds the corners."
              />
              <div className="max-w-520">
                <Field
                  id="imageAlt"
                  label="Image description"
                  required={file !== null}
                  helper="For people who cannot see the picture, for example “Tour website homepage on a tablet”."
                  error={altError ?? undefined}
                >
                  <Input
                    id="imageAlt"
                    maxLength={ALT_MAX_LENGTH}
                    value={alt}
                    invalid={Boolean(altError)}
                    onChange={(event) => setAlt(event.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Card>
        )}
      </fieldset>

      {canSubmit && (
        <div className="flex flex-wrap items-center gap-12">
          {editing ? (
            <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? "Saving" : "Save changes"}
            </Button>
          ) : (
            <>
              <Button type="submit" variant="outline" disabled={isSubmitting}>
                {isSubmitting ? "Saving" : "Save draft"}
              </Button>
              <Button variant="primary" disabled={isSubmitting} onClick={handleSubmit((values) => create(values, true))}>
                Publish
              </Button>
            </>
          )}
          <p role="status" className="type-body-14 text-fg-muted">
            {saved && "Saved."}
          </p>
        </div>
      )}
      {formError && (
        <p role="alert" className="type-body-14 text-fg-primary flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
          {formError}
        </p>
      )}
    </form>
  );
}
