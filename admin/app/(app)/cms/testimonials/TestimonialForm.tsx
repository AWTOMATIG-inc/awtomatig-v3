"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type Path, useForm, useWatch } from "react-hook-form";

import { ImagePicker } from "@/components/cms/ImagePicker";
import { Button, Card, CardHeader, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import { SERVICE_IDS, SERVICE_LABEL } from "@/lib/cms/case-studies";
import { uploadTestimonialLogo } from "@/lib/cms/image";
import {
  type TestimonialFormValues,
  testimonialFormSchema,
  toCreateBody,
  toFormValues,
  toUpdateBody,
} from "@/lib/cms/testimonial-form";
import {
  CONSENT_SENTENCE,
  QUOTE_MAX_LENGTH,
  QUOTE_WARN_LENGTH,
  type Testimonial,
  testimonialHref,
  type TestimonialNotice,
} from "@/lib/cms/testimonials";

import { LOGO_HINT } from "./logo-hint";

const describe = (id: string, hasError: boolean) => (hasError ? `${id}-error` : undefined);

/**
 * The testimonial form, for a new testimonial (`testimonial` omitted) and for editing one. A new one is saved as a draft or
 * published at once, and its logo is chosen here and uploaded right after it is created. An existing one is saved in place; its
 * logo has its own card on its page. The client's agreement is a checkbox: publishing needs it, and once the testimonial is
 * live it cannot be taken back (unpublish first). Without permission every field is read-only. Validation here is feedback
 * only: the backend repeats it, and its messages are shown next to the field they belong to.
 */
export function TestimonialForm({ testimonial, canSubmit }: { testimonial?: Testimonial; canSubmit: boolean }) {
  const router = useRouter();
  const editing = testimonial !== undefined;
  const published = testimonial?.status === "published";
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // The logo of a new testimonial: chosen here, uploaded after the testimonial exists.
  const [file, setFile] = useState<File | null>(null);
  // The field to move to after a failed save. The form is disabled while it saves, and a disabled field cannot take focus, so the
  // move waits until the save has finished.
  const [focusId, setFocusId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TestimonialFormValues>({ resolver: zodResolver(testimonialFormSchema), defaultValues: toFormValues(testimonial) });

  useEffect(() => {
    if (focusId && !isSubmitting) document.getElementById(focusId)?.focus();
  }, [focusId, isSubmitting]);

  const [quote, blackLogo] = useWatch({ control, name: ["quote", "logoInBlack"] });
  const quoteLength = quote.trim().length;

  /** Puts the backend's field messages next to their fields; whatever has no field becomes the message under the buttons. */
  function showFailure(error: unknown, status: number) {
    let placed = 0;
    for (const [path, message] of Object.entries(apiFieldErrors(error))) {
      setError(path as Path<TestimonialFormValues>, { message });
      if (placed === 0) setFocusId(path === "consentConfirmed" ? "consentConfirmed" : path);
      placed += 1;
    }
    setFormError(
      status === 403
        ? "You do not have permission to do this."
        : placed > 0
          ? "Some details need another look. They are marked above."
          : apiMessage(error, "The testimonial could not be saved. Try again."),
    );
  }

  async function create(values: TestimonialFormValues, publish: boolean) {
    setFormError(null);
    setFocusId(null);
    // Check this first, so nothing is created that cannot be finished.
    if (publish && !values.consentConfirmed) {
      setError("consentConfirmed", { message: "Confirm the client agreed before publishing. A draft can be saved without it." });
      setFocusId("consentConfirmed");
      return;
    }

    try {
      const { data, response, error } = await api.POST("/api/v1/cms/testimonials", { body: toCreateBody(values) });
      if (response.status === 401) return router.replace("/login");
      if (!data) return showFailure(error, response.status);

      let notice: TestimonialNotice | null = null;
      if (file) {
        const upload = await uploadTestimonialLogo(data.id, file);
        if (!upload.ok) notice = "logo-failed";
      }
      if (publish && notice === null) {
        const done = await api.POST("/api/v1/cms/testimonials/{id}/publish", { params: { path: { id: data.id } } });
        if (!done.response.ok) notice = "publish-failed";
      }
      router.push(notice ? `${testimonialHref(data.id)}?notice=${notice}` : testimonialHref(data.id));
      router.refresh();
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
    }
  }

  async function update(values: TestimonialFormValues) {
    if (!testimonial) return;
    setFormError(null);
    setSaved(false);
    setFocusId(null);
    try {
      const { data, response, error } = await api.PATCH("/api/v1/cms/testimonials/{id}", {
        params: { path: { id: testimonial.id } },
        body: toUpdateBody(values, { published: Boolean(published) }),
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

  const textField = (name: "quote" | "name" | "role" | "company") => ({
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
        <Card aria-labelledby="quote-title">
          <CardHeader
            id="quote-title"
            title="The quote"
            subtitle="Shown on the card exactly as written, so use the client's own words."
          />
          <div className="flex flex-col gap-20 p-20">
            <Field
              id="quote"
              label="Quote"
              required
              helper={`${quoteLength} of ${QUOTE_MAX_LENGTH} characters.`}
              error={errors.quote?.message}
            >
              <Textarea id="quote" rows={5} maxLength={QUOTE_MAX_LENGTH + 100} {...textField("quote")} />
            </Field>
            {quoteLength > QUOTE_WARN_LENGTH && quoteLength <= QUOTE_MAX_LENGTH && (
              <p role="status" className="type-body-14 text-fg-primary -mt-8 flex items-start gap-8">
                <span aria-hidden="true" className="bg-status-caution mt-8 size-6 shrink-0 rounded-full" />A long quote makes
                every card on the website taller. Under {QUOTE_WARN_LENGTH} characters reads best.
              </p>
            )}
          </div>
        </Card>

        <Card aria-labelledby="person-title">
          <CardHeader id="person-title" title="Who said it" subtitle="Shown under the quote." />
          <div className="grid gap-20 p-20 sm:grid-cols-2">
            <Field id="name" label="Name" required error={errors.name?.message}>
              <Input id="name" maxLength={120} autoComplete="off" {...textField("name")} />
            </Field>
            <Field id="role" label="Role" required error={errors.role?.message}>
              <Input id="role" maxLength={120} autoComplete="off" {...textField("role")} />
            </Field>
            <Field id="company" label="Company" required error={errors.company?.message}>
              <Input id="company" maxLength={120} autoComplete="off" {...textField("company")} />
            </Field>
            <Field
              id="service"
              label="Service"
              required
              helper="The chip at the top of the card: which service the quote is about."
              error={errors.service?.message}
            >
              <Select id="service" invalid={Boolean(errors.service)} {...register("service")}>
                {SERVICE_IDS.map((value) => (
                  <option key={value} value={value}>
                    {SERVICE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        {!editing && (
          <Card aria-labelledby="logo-title">
            <CardHeader
              id="logo-title"
              title="Company logo"
              subtitle="Optional. Without one, the card shows the company name instead."
            />
            <div className="grid gap-20 p-20 md:grid-cols-[320px_1fr]">
              <ImagePicker
                variant="logo"
                noun="logo"
                blackLogo={blackLogo}
                onFile={setFile}
                disabled={!canSubmit || isSubmitting}
                hint={LOGO_HINT}
              />
              <div className="max-w-520">
                <Checkbox label="Show the logo in black" {...register("logoInBlack")} />
                <p className="type-body-14 text-fg-muted mt-6">
                  Tick this for a white or very light logo, which would be invisible on the white card. A coloured logo ticked
                  this way turns fully black.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card aria-labelledby="consent-title">
          <CardHeader
            id="consent-title"
            title="Permission"
            subtitle="A real person's name and company will be on a public page, so their agreement is needed to publish."
          />
          <div className="p-20">
            {published ? (
              <p className="type-body-14 text-fg-primary">
                {CONSENT_SENTENCE}{" "}
                <span className="text-fg-muted">This is recorded. To change it, unpublish the testimonial first.</span>
              </p>
            ) : (
              <>
                <Checkbox
                  id="consentConfirmed"
                  label={CONSENT_SENTENCE}
                  aria-describedby={describe("consentConfirmed", Boolean(errors.consentConfirmed))}
                  {...register("consentConfirmed")}
                />
                {errors.consentConfirmed?.message && (
                  <p
                    id="consentConfirmed-error"
                    role="alert"
                    className="type-body-14 text-fg-primary mt-6 flex items-start gap-8"
                  >
                    <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
                    {errors.consentConfirmed.message}
                  </p>
                )}
              </>
            )}
          </div>
        </Card>
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
