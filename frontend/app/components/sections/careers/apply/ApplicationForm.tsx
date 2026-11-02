"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button, Field, FIELD, Required } from "@/app/components/ui";
import type { Job } from "@/lib/careers";
import { SITE } from "@/lib/site";
import {
  EMPTY_EDUCATION,
  EMPTY_EXPERIENCE,
  LIMITS,
  resumeError,
  validateApplication,
  type ApplicationDraft,
  type Education,
  type Experience,
  type FieldErrors,
} from "./application";
import { EducationRows, ExperienceRows } from "./RowEditors";
import ResumePicker from "./ResumePicker";
import { submitApplication } from "./submitApplication";

type Keyed<T> = T & { key: string };
let rowCounter = 0;
const keyed = <T,>(row: T): Keyed<T> => ({ ...row, key: `row-${++rowCounter}` });
function unkey<T>(row: Keyed<T>): T {
  const { key, ...rest } = row;
  void key;
  return rest as unknown as T;
}

function Section({ title, hint, required, children }: { title: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <section className="border-border mt-28 border-t pt-28">
      <h3 className="type-heading-24 tracking-tight">
        {title}
        {required && <Required />}
      </h3>
      {hint && <p className="type-body-14 text-fg-muted mt-6">{hint}</p>}
      <div className="mt-20 grid gap-16">{children}</div>
    </section>
  );
}

type Status = { kind: "idle" } | { kind: "sent"; email: string } | { kind: "error"; message: string };

// The application form on a job's page. Everything is checked in the browser first (the same rules as the server, which checks
// again); the Server Action then stores the application in the backend and emails the candidate. Submitting by hand keeps every
// field filled if sending fails.
export default function ApplicationForm({ job }: { job: Pick<Job, "slug" | "title" | "questions"> }) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [focusTick, setFocusTick] = useState(0);
  // One id per application, kept until it is sent: pressing Apply again after an error cannot store it twice.
  const submissionId = useRef<string | null>(null);

  const [person, setPerson] = useState({ fullName: "", email: "", phone: "", githubUrl: "", linkedinUrl: "" });
  const [educations, setEducations] = useState<Keyed<Education>[]>([{ ...EMPTY_EDUCATION, key: "education-first" }]);
  const [experiences, setExperiences] = useState<Keyed<Experience>[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resume, setResume] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);

  // After a failed check, move to the first field with a problem
  useEffect(() => {
    if (focusTick === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    first?.focus({ preventScroll: true });
  }, [focusTick]);

  const clear = (...paths: string[]) =>
    setErrors((current) => {
      if (!paths.some((path) => current[path])) return current;
      const next = { ...current };
      for (const path of paths) delete next[path];
      return next;
    });

  const setPersonField = (field: keyof typeof person) => (e: { target: { value: string } }) => {
    setPerson((current) => ({ ...current, [field]: e.target.value }));
    clear(field);
  };

  const pickResume = (file: File | null) => {
    setResume(file);
    const problem = file ? resumeError({ name: file.name, size: file.size, type: file.type }) : undefined;
    setErrors((current) => {
      const next = { ...current };
      if (problem) next.resume = problem;
      else delete next.resume;
      return next;
    });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const draft: ApplicationDraft = {
      ...person,
      educations: educations.map(unkey),
      experiences: experiences.map(unkey),
      answers,
      consent,
    };
    const found = validateApplication(
      draft,
      job.questions,
      resume && { name: resume.name, size: resume.size, type: resume.type },
    );
    if (Object.keys(found).length > 0 || !resume) {
      setErrors(found);
      setStatus({ kind: "error", message: "Please fix the highlighted fields and try again." });
      setFocusTick((tick) => tick + 1);
      return;
    }

    submissionId.current ??= crypto.randomUUID();
    const data = new FormData();
    data.set("jobSlug", job.slug);
    data.set("submissionId", submissionId.current);
    data.set("draft", JSON.stringify(draft));
    data.set("resume", resume);
    data.set("website", String(new FormData(e.currentTarget).get("website") ?? ""));
    setErrors({});
    setStatus({ kind: "idle" });

    startTransition(async () => {
      try {
        const result = await submitApplication(data);
        if (!result.ok) {
          setErrors(result.fieldErrors ?? {});
          setStatus({ kind: "error", message: result.error });
          setFocusTick((tick) => tick + 1);
          return;
        }
        window.dataLayer?.push({ event: "submit_application", form_id: "career_application", job: job.slug });
        submissionId.current = null;
        setStatus({ kind: "sent", email: result.email || draft.email.trim() });
      } catch {
        setStatus({ kind: "error", message: "We couldn't send your application right now. Please try again in a moment." });
      }
    });
  };

  if (status.kind === "sent") {
    return (
      <div className="rounded-16 bg-surface p-20 lg:p-28" role="status">
        <h3 className="type-heading-28">Application received</h3>
        <p className="type-body-16 text-fg-primary mt-16">
          Thanks for applying for {job.title}. We have your application, and a confirmation is on its way to{" "}
          <strong className="text-fg-strong break-all">{status.email}</strong>. If it does not arrive in a few minutes, check your
          spam folder.
        </p>
        <Button href="/careers" variant="dark" size="lg" className="mt-28">
          See other openings
        </Button>
      </div>
    );
  }

  const mark = (path: string, fieldId: string) =>
    errors[path] ? { "aria-invalid": true as const, "aria-describedby": `${fieldId}-error` } : {};
  const personId = (field: string) => `${id}-${field}`;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="rounded-16 bg-surface p-20 lg:p-28">
      <h3 className="type-heading-28">Apply for this position</h3>
      <p className="type-body-14 text-fg-muted mt-8">
        Fields marked <span className="text-status-warning">*</span> are required.
      </p>

      <div className="mt-20 grid gap-16">
        <Field label="Full name" required htmlFor={personId("name")} error={errors.fullName}>
          <input
            id={personId("name")}
            type="text"
            autoComplete="name"
            maxLength={LIMITS.text}
            value={person.fullName}
            onChange={setPersonField("fullName")}
            className={FIELD}
            {...mark("fullName", personId("name"))}
          />
        </Field>
        <div className="grid gap-16 sm:grid-cols-2">
          <Field label="Email" required htmlFor={personId("email")} error={errors.email}>
            <input
              id={personId("email")}
              type="email"
              autoComplete="email"
              maxLength={LIMITS.email}
              value={person.email}
              onChange={setPersonField("email")}
              className={FIELD}
              {...mark("email", personId("email"))}
            />
          </Field>
          <Field
            label="Phone"
            required
            htmlFor={personId("phone")}
            error={errors.phone}
            hint="A mobile number we can call, e.g. 01712 345678"
          >
            <input
              id={personId("phone")}
              type="tel"
              autoComplete="tel"
              maxLength={LIMITS.phone}
              value={person.phone}
              onChange={setPersonField("phone")}
              className={FIELD}
              {...mark("phone", personId("phone"))}
            />
          </Field>
        </div>
      </div>

      <Section title="Education" hint="Add every degree you want us to consider. At least one is required.">
        {errors.educations && (
          <p role="alert" className="type-caption-12 text-fg-strong font-medium">
            {errors.educations}
          </p>
        )}
        <EducationRows
          idPrefix={id}
          rows={educations}
          errors={errors}
          onChange={(index, patch) => {
            setEducations((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
            clear(...Object.keys(patch).map((field) => `educations.${index}.${field}`), `educations.${index}.completedOn`);
          }}
          onRemove={(index) => {
            setEducations((rows) => rows.filter((_, i) => i !== index));
            setErrors((current) =>
              Object.fromEntries(Object.entries(current).filter(([path]) => !path.startsWith("educations."))),
            );
          }}
        />
        {educations.length < LIMITS.educations && (
          <Button
            type="button"
            variant="outline"
            size="md"
            className="justify-self-start"
            onClick={() => setEducations((rows) => [...rows, keyed(EMPTY_EDUCATION)])}
          >
            Add another education
          </Button>
        )}
      </Section>

      <Section title="Experience (optional)" hint="Your work history, newest first. Leave this empty if you are starting out.">
        {experiences.length > 0 && (
          <ExperienceRows
            idPrefix={id}
            rows={experiences}
            errors={errors}
            onChange={(index, patch) => {
              setExperiences((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
              clear(...Object.keys(patch).map((field) => `experiences.${index}.${field}`), `experiences.${index}.toOn`);
            }}
            onRemove={(index) => {
              setExperiences((rows) => rows.filter((_, i) => i !== index));
              setErrors((current) =>
                Object.fromEntries(Object.entries(current).filter(([path]) => !path.startsWith("experiences."))),
              );
            }}
          />
        )}
        {experiences.length < LIMITS.experiences && (
          <Button
            type="button"
            variant="outline"
            size="md"
            className="justify-self-start"
            onClick={() => setExperiences((rows) => [...rows, keyed(EMPTY_EXPERIENCE)])}
          >
            {experiences.length === 0 ? "Add experience" : "Add another experience"}
          </Button>
        )}
      </Section>

      <Section title="Links (optional)">
        <div className="grid gap-16 sm:grid-cols-2">
          <Field label="GitHub" htmlFor={personId("github")} error={errors.githubUrl}>
            <input
              id={personId("github")}
              type="url"
              inputMode="url"
              maxLength={LIMITS.link}
              placeholder="https://github.com/your-name"
              value={person.githubUrl}
              onChange={setPersonField("githubUrl")}
              className={FIELD}
              {...mark("githubUrl", personId("github"))}
            />
          </Field>
          <Field label="LinkedIn" htmlFor={personId("linkedin")} error={errors.linkedinUrl}>
            <input
              id={personId("linkedin")}
              type="url"
              inputMode="url"
              maxLength={LIMITS.link}
              placeholder="https://www.linkedin.com/in/your-name"
              value={person.linkedinUrl}
              onChange={setPersonField("linkedinUrl")}
              className={FIELD}
              {...mark("linkedinUrl", personId("linkedin"))}
            />
          </Field>
        </div>
      </Section>

      {job.questions.length > 0 && (
        <Section title="A few questions">
          {job.questions.map((question) => {
            const fieldId = `${id}-q-${question.id}`;
            const path = `answers.${question.id}`;
            return (
              <Field
                key={question.id}
                label={question.text}
                required={question.required}
                htmlFor={fieldId}
                error={errors[path]}
                labelClassName="type-body-14 block font-medium"
              >
                <textarea
                  id={fieldId}
                  maxLength={LIMITS.answer}
                  value={answers[question.id] ?? ""}
                  onChange={(e) => {
                    setAnswers((current) => ({ ...current, [question.id]: e.target.value }));
                    clear(path);
                  }}
                  className={`${FIELD} h-auto min-h-104 resize-y py-12`}
                  {...mark(path, fieldId)}
                />
              </Field>
            );
          })}
        </Section>
      )}

      <Section title="Resume" required>
        <ResumePicker id={`${id}-resume`} resume={resume} error={errors.resume} onPick={pickResume} />
      </Section>

      {/* Honeypot: off screen and out of the tab order; people never fill it, bots do */}
      <div aria-hidden="true" className="sr-only">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-28">
        <label className="type-body-14 flex cursor-pointer items-center gap-12">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              clear("consent");
            }}
            className="rounded-12 border-border bg-surface accent-action-primary size-20 shrink-0 cursor-pointer border"
            data-invalid={errors.consent ? "true" : undefined}
            aria-describedby={errors.consent ? `${id}-consent-error` : undefined}
          />
          <span>
            I agree that AWTOMATIG may use the information and resume I provide to consider my application, as described in the{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 transition-colors duration-200 hover:text-black/60 motion-reduce:transition-none"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p id={`${id}-consent-error`} role="alert" className="type-caption-12 text-fg-strong mt-8 font-medium">
            {errors.consent}
          </p>
        )}
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={pending} className="mt-28">
        {pending ? "Sending…" : "Submit application"}
      </Button>
      <p role="status" className="type-body-14 text-fg-primary mt-12 text-center empty:hidden">
        {status.kind === "error" && (
          <>
            {status.message}{" "}
            {status.message.startsWith("We couldn") && (
              <>
                You can also email us at{" "}
                <a href={`mailto:${SITE.email}`} className="underline underline-offset-2">
                  {SITE.email}
                </a>
                .
              </>
            )}
          </>
        )}
      </p>
    </form>
  );
}
