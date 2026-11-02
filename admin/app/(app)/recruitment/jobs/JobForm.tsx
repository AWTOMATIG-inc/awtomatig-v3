"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type FieldErrors, type Path, useFieldArray, useForm } from "react-hook-form";

import { Button, Card, CardHeader, Checkbox, Field, IconButton, Input, Select, Textarea } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import {
  type JobFormValues,
  jobFormSchema,
  MAX_QUESTIONS,
  toCreateBody,
  toFormValues,
  toUpdateBody,
} from "@/lib/recruitment/job-form";
import { type Job, JOB_TYPE_LABEL, JOB_TYPES, jobHref, WORK_MODE_LABEL, WORK_MODES } from "@/lib/recruitment/jobs";

/** One line under a section title when its fields have an error, so a problem in a long form is easy to find. */
const describe = (id: string, errors: FieldErrors<JobFormValues>, key: keyof JobFormValues) =>
  errors[key] ? `${id}-error` : undefined;

/**
 * The job opening form, for a new opening (`job` omitted) and for editing one. Sections follow the plan: basics, salary,
 * content, deadline, screening questions. A new opening is saved as a draft or published at once; an existing one is saved
 * in place (publishing, closing and reopening are buttons on the opening's page). Without permission every field is read-only.
 * Validation here is for feedback only: the backend repeats it, and its messages are shown next to the field they belong to.
 */
export function JobForm({ job, canSubmit }: { job?: Job; canSubmit: boolean }) {
  const router = useRouter();
  const editing = job !== undefined;
  const schema = useMemo(() => jobFormSchema({ initialDeadline: job?.deadlineOn ?? null }), [job?.deadlineOn]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<JobFormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(job) });
  const { fields: questions, append, remove, move } = useFieldArray({ control, name: "questions" });

  /** Puts the backend's field messages next to their fields; whatever has no field becomes the message under the buttons. */
  function showFailure(error: unknown, status: number) {
    const fieldErrors = apiFieldErrors(error);
    let placed = 0;
    for (const [path, message] of Object.entries(fieldErrors)) {
      setError(path as Path<JobFormValues>, { message });
      placed += 1;
    }
    setFormError(
      status === 403
        ? "You do not have permission to do this."
        : placed > 0
          ? "Some details need another look. They are marked above."
          : apiMessage(error, "The opening could not be saved. Try again."),
    );
  }

  async function save(values: JobFormValues, publish: boolean) {
    setFormError(null);
    setSaved(false);
    try {
      if (!editing) {
        const { data, response, error } = await api.POST("/api/v1/recruitment/jobs", { body: toCreateBody(values, publish) });
        if (response.status === 401) return router.replace("/login");
        if (!data) return showFailure(error, response.status);
        router.push(jobHref(data.id, publish ? "applications" : "details"));
        router.refresh();
        return;
      }
      const { data, response, error } = await api.PATCH("/api/v1/recruitment/jobs/{id}", {
        params: { path: { id: job.id } },
        body: toUpdateBody(values),
      });
      if (response.status === 401) return router.replace("/login");
      if (!data) return showFailure(error, response.status);
      // Start again from what the server stored, so new questions now carry their ids.
      reset(toFormValues(data));
      setSaved(true);
      router.refresh();
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
    }
  }

  const grid = "grid gap-20 p-20 sm:grid-cols-2";

  return (
    <form onSubmit={handleSubmit((values) => save(values, false))} noValidate className="flex flex-col gap-20">
      <fieldset disabled={!canSubmit || isSubmitting} className="flex min-w-0 flex-col gap-20">
        <Card aria-labelledby="basics-title">
          <CardHeader id="basics-title" title="Basics" />
          <div className={grid}>
            <div className="sm:col-span-2">
              <Field id="title" label="Position name" required error={errors.title?.message}>
                <Input
                  id="title"
                  maxLength={200}
                  invalid={Boolean(errors.title)}
                  aria-describedby={describe("title", errors, "title")}
                  {...register("title")}
                />
              </Field>
            </div>
            <Field id="jobType" label="Job type" required error={errors.jobType?.message}>
              <Select id="jobType" invalid={Boolean(errors.jobType)} {...register("jobType")}>
                {JOB_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {JOB_TYPE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="workMode" label="Work mode" required error={errors.workMode?.message}>
              <Select id="workMode" invalid={Boolean(errors.workMode)} {...register("workMode")}>
                {WORK_MODES.map((value) => (
                  <option key={value} value={value}>
                    {WORK_MODE_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="vacancies" label="Vacancies" required error={errors.vacancies?.message}>
              <Input
                id="vacancies"
                inputMode="numeric"
                autoComplete="off"
                invalid={Boolean(errors.vacancies)}
                aria-describedby={describe("vacancies", errors, "vacancies")}
                {...register("vacancies")}
              />
            </Field>
            <Field id="location" label="Location" required error={errors.location?.message}>
              <Input
                id="location"
                maxLength={200}
                invalid={Boolean(errors.location)}
                aria-describedby={describe("location", errors, "location")}
                {...register("location")}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                id="officeTiming"
                label="Office timing"
                required
                helper="For example: Mon - Fri, 11 AM to 6 PM."
                error={errors.officeTiming?.message}
              >
                <Input
                  id="officeTiming"
                  maxLength={200}
                  invalid={Boolean(errors.officeTiming)}
                  aria-describedby={describe("officeTiming", errors, "officeTiming")}
                  {...register("officeTiming")}
                />
              </Field>
            </div>
          </div>
        </Card>

        <Card aria-labelledby="salary-title">
          <CardHeader
            id="salary-title"
            title="Salary"
            subtitle="In BDT, per month. Leave both empty to show “Negotiable”. Only a minimum means a fixed amount."
          />
          <div className={grid}>
            <Field id="salaryMin" label="From (BDT)" error={errors.salaryMin?.message}>
              <Input
                id="salaryMin"
                inputMode="decimal"
                autoComplete="off"
                placeholder="50000"
                invalid={Boolean(errors.salaryMin)}
                aria-describedby={describe("salaryMin", errors, "salaryMin")}
                {...register("salaryMin")}
              />
            </Field>
            <Field id="salaryMax" label="To (BDT, optional)" error={errors.salaryMax?.message}>
              <Input
                id="salaryMax"
                inputMode="decimal"
                autoComplete="off"
                placeholder="80000"
                invalid={Boolean(errors.salaryMax)}
                aria-describedby={describe("salaryMax", errors, "salaryMax")}
                {...register("salaryMax")}
              />
            </Field>
          </div>
        </Card>

        <Card aria-labelledby="content-title">
          <CardHeader
            id="content-title"
            title="Description"
            subtitle="Plain text. Blank lines separate paragraphs; in requirements and benefits, each line becomes a bullet."
          />
          <div className="flex flex-col gap-20 p-20">
            <Field id="description" label="About the role" required error={errors.description?.message}>
              <Textarea
                id="description"
                rows={8}
                maxLength={10_000}
                invalid={Boolean(errors.description)}
                aria-describedby={describe("description", errors, "description")}
                {...register("description")}
              />
            </Field>
            <Field id="requirements" label="Requirements" helper="One per line." error={errors.requirements?.message}>
              <Textarea
                id="requirements"
                rows={6}
                maxLength={10_000}
                invalid={Boolean(errors.requirements)}
                {...register("requirements")}
              />
            </Field>
            <Field id="benefits" label="Benefits" helper="One per line." error={errors.benefits?.message}>
              <Textarea id="benefits" rows={5} maxLength={10_000} invalid={Boolean(errors.benefits)} {...register("benefits")} />
            </Field>
          </div>
        </Card>

        <Card aria-labelledby="deadline-title">
          <CardHeader
            id="deadline-title"
            title="Deadline"
            subtitle="Candidates can apply through the end of this day, Dhaka time. After it the opening stops taking applications by itself."
          />
          <div className="max-w-320 p-20">
            <Field id="deadlineOn" label="Last day to apply" required error={errors.deadlineOn?.message}>
              <Input
                id="deadlineOn"
                type="date"
                invalid={Boolean(errors.deadlineOn)}
                aria-describedby={describe("deadlineOn", errors, "deadlineOn")}
                {...register("deadlineOn")}
              />
            </Field>
          </div>
        </Card>

        <Card aria-labelledby="questions-title">
          <CardHeader
            id="questions-title"
            title="Screening questions"
            subtitle={`Free-text questions candidates answer when they apply. ${questions.length} of ${MAX_QUESTIONS}.`}
          />
          <div className="flex flex-col gap-16 p-20">
            {questions.length === 0 && <p className="type-body-14 text-fg-muted">No questions. Candidates apply without any.</p>}
            {questions.length > 0 && (
              <ol className="flex flex-col gap-16">
                {questions.map((question, index) => {
                  const error = errors.questions?.[index]?.text?.message;
                  return (
                    <li key={question.id} className="rounded-8 border-border border p-16">
                      <div className="mb-8 flex items-center justify-between gap-12">
                        <span className="type-caption-12 text-fg-muted uppercase">Question {index + 1}</span>
                        <div className="flex items-center gap-8">
                          <IconButton
                            label={`Move question ${index + 1} up`}
                            icon={<ArrowUp strokeWidth={1.5} />}
                            disabled={index === 0}
                            onClick={() => move(index, index - 1)}
                          />
                          <IconButton
                            label={`Move question ${index + 1} down`}
                            icon={<ArrowDown strokeWidth={1.5} />}
                            disabled={index === questions.length - 1}
                            onClick={() => move(index, index + 1)}
                          />
                          <IconButton
                            label={`Remove question ${index + 1}`}
                            icon={<Trash2 strokeWidth={1.5} />}
                            onClick={() => remove(index)}
                          />
                        </div>
                      </div>
                      <Field id={`question-${index}`} label="Question text" error={error}>
                        <Textarea
                          id={`question-${index}`}
                          rows={2}
                          maxLength={500}
                          className="min-h-80"
                          invalid={Boolean(error)}
                          aria-describedby={error ? `question-${index}-error` : undefined}
                          {...register(`questions.${index}.text`)}
                        />
                      </Field>
                      <div className="mt-12">
                        <Checkbox label="Candidates must answer" {...register(`questions.${index}.required`)} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {errors.questions?.message && (
              <p role="alert" className="type-body-14 text-fg-primary flex items-start gap-8">
                <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
                {errors.questions.message}
              </p>
            )}
            <div>
              <Button
                variant="outline"
                icon={<Plus strokeWidth={1.5} />}
                disabled={questions.length >= MAX_QUESTIONS}
                onClick={() => append({ text: "", required: true })}
              >
                Add question
              </Button>
            </div>
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
              <Button variant="primary" disabled={isSubmitting} onClick={handleSubmit((values) => save(values, true))}>
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
