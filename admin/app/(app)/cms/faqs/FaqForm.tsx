"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type Path, useForm, useWatch } from "react-hook-form";

import { Button, Card, CardHeader, Field, Input, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import { type FaqFormValues, faqFormSchema, toBody, toFormValues } from "@/lib/cms/faq-form";
import { ANSWER_MAX_LENGTH, type Faq, faqHref, type FaqNotice, QUESTION_MAX_LENGTH } from "@/lib/cms/faqs";

const describe = (id: string, hasError: boolean) => (hasError ? `${id}-error` : undefined);

/**
 * The FAQ form, for a new FAQ (`faq` omitted) and for editing one. A new one is saved as a draft or published at once; an
 * existing one is saved in place (a live FAQ goes live again with the change). The answer is plain text: line breaks are kept,
 * nothing else is formatted. Without permission every field is read-only. Validation here is feedback only: the backend repeats
 * it, and its messages are shown next to the field they belong to.
 */
export function FaqForm({ faq, canSubmit }: { faq?: Faq; canSubmit: boolean }) {
  const router = useRouter();
  const editing = faq !== undefined;
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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
  } = useForm<FaqFormValues>({ resolver: zodResolver(faqFormSchema), defaultValues: toFormValues(faq) });

  useEffect(() => {
    if (focusId && !isSubmitting) document.getElementById(focusId)?.focus();
  }, [focusId, isSubmitting]);

  const [question, answer] = useWatch({ control, name: ["question", "answer"] });

  /** Puts the backend's field messages next to their fields; whatever has no field becomes the message under the buttons. */
  function showFailure(error: unknown, status: number) {
    let placed = 0;
    for (const [path, message] of Object.entries(apiFieldErrors(error))) {
      setError(path as Path<FaqFormValues>, { message });
      if (placed === 0) setFocusId(path);
      placed += 1;
    }
    setFormError(
      status === 403
        ? "You do not have permission to do this."
        : placed > 0
          ? "Some details need another look. They are marked above."
          : apiMessage(error, "The FAQ could not be saved. Try again."),
    );
  }

  async function create(values: FaqFormValues, publish: boolean) {
    setFormError(null);
    setFocusId(null);
    try {
      const { data, response, error } = await api.POST("/api/v1/cms/faqs", { body: toBody(values) });
      if (response.status === 401) return router.replace("/login");
      if (!data) return showFailure(error, response.status);

      let notice: FaqNotice | null = null;
      if (publish) {
        const done = await api.POST("/api/v1/cms/faqs/{id}/publish", { params: { path: { id: data.id } } });
        if (!done.response.ok) notice = "publish-failed";
      }
      router.push(notice ? `${faqHref(data.id)}?notice=${notice}` : faqHref(data.id));
      router.refresh();
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
    }
  }

  async function update(values: FaqFormValues) {
    if (!faq) return;
    setFormError(null);
    setSaved(false);
    setFocusId(null);
    try {
      const { data, response, error } = await api.PATCH("/api/v1/cms/faqs/{id}", {
        params: { path: { id: faq.id } },
        body: toBody(values),
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

  return (
    <form
      onSubmit={handleSubmit((values) => (editing ? update(values) : create(values, false)))}
      noValidate
      className="flex flex-col gap-20"
    >
      <fieldset disabled={!canSubmit || isSubmitting} className="flex min-w-0 flex-col gap-20">
        <Card aria-labelledby="faq-title">
          <CardHeader
            id="faq-title"
            title="Question and answer"
            subtitle="Shown in the website's FAQ accordion exactly as written. The answer is plain text; line breaks are kept."
          />
          <div className="flex flex-col gap-20 p-20">
            <Field
              id="question"
              label="Question"
              required
              helper={`${question.trim().length} of ${QUESTION_MAX_LENGTH} characters.`}
              error={errors.question?.message}
            >
              <Input
                id="question"
                maxLength={QUESTION_MAX_LENGTH + 50}
                autoComplete="off"
                invalid={Boolean(errors.question)}
                aria-describedby={describe("question", Boolean(errors.question))}
                {...register("question")}
              />
            </Field>
            <Field
              id="answer"
              label="Answer"
              required
              helper={`${answer.trim().length} of ${ANSWER_MAX_LENGTH} characters.`}
              error={errors.answer?.message}
            >
              <Textarea
                id="answer"
                rows={8}
                maxLength={ANSWER_MAX_LENGTH + 100}
                invalid={Boolean(errors.answer)}
                aria-describedby={describe("answer", Boolean(errors.answer))}
                {...register("answer")}
              />
            </Field>
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
