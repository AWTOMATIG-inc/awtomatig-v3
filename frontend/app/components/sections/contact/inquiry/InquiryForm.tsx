"use client";

import Link from "next/link";
import { useId, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button } from "@/app/components/ui";
import { ChevronRightIcon } from "@/app/components/icons";
import { SITE } from "@/lib/site";
import { BUDGETS, HELP_OPTIONS, PROJECT_TYPES } from "./inquiry";
import { sendInquiry } from "./sendInquiry";

const FIELD =
  "type-body-14 h-48 w-full rounded-8 bg-surface-subtle px-16 text-fg-strong placeholder:text-black/40 transition-colors duration-200 hover:bg-off-white motion-reduce:transition-none";
const LABEL = "type-caption-12 block font-medium uppercase";

const CHIP_BASE =
  "type-body-14 inline-flex h-41 cursor-pointer items-center rounded-12 px-24 transition-colors duration-200 select-none peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary motion-reduce:transition-none";

function Required() {
  return (
    <span aria-hidden="true" className="text-status-warning">
      {" "}
      *
    </span>
  );
}

function Field({
  label,
  required,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
        {required && <Required />}
      </label>
      <div className="mt-8">{children}</div>
    </div>
  );
}

// Single-choice chips: real radio inputs, so keyboard and screen readers work. `active` is the selected look.
function ChipGroup({ legend, name, options, active }: { legend: string; name: string; options: string[]; active: string }) {
  return (
    <fieldset>
      <legend className={LABEL}>
        {legend}
        <Required />
      </legend>
      <div className="mt-8 flex flex-wrap gap-8 lg:gap-12">
        {options.map((option, i) => (
          <label key={option} className="relative">
            <input type="radio" name={name} value={option} defaultChecked={i === 0} required className="peer sr-only" />
            <span className={`${CHIP_BASE} bg-surface-subtle hover:bg-action-primary/20 ${active}`}>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type Status = { kind: "idle" } | { kind: "sent" } | { kind: "error"; message: string };

// Project inquiry form (Contact page). The `sendInquiry` Server Action emails the team; a GA4 `generate_lead` reaches GTM
// only once the email has gone out. Submitting by hand (not `<form action>`) keeps the fields filled if sending fails.
export default function InquiryForm() {
  const id = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  // One id per message, kept until it is sent: pressing Send again after an error cannot store the lead twice.
  const submissionId = useRef<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    submissionId.current ??= crypto.randomUUID();
    data.set("submissionId", submissionId.current);
    startTransition(async () => {
      try {
        const result = await sendInquiry(data);
        if (!result.ok) return setStatus({ kind: "error", message: result.error });
        window.dataLayer?.push({
          event: "generate_lead",
          form_id: "contact_inquiry",
          service: result.help,
          project_type: result.type,
        });
        form.reset();
        submissionId.current = null;
        setStatus({ kind: "sent" });
      } catch {
        setStatus({ kind: "error", message: "We couldn't send your message right now." });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="rounded-16 bg-surface p-20 lg:p-28">
      <h3 className="type-heading-28">Tell us about the project</h3>

      <div className="mt-20 grid gap-20">
        <div className="grid gap-20 sm:grid-cols-2 sm:gap-16">
          <Field label="Your name" required htmlFor={`${id}-name`}>
            <input
              id={`${id}-name`}
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Type here..."
              className={FIELD}
            />
          </Field>
          <Field label="Work email" required htmlFor={`${id}-email`}>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Type here..."
              className={FIELD}
            />
          </Field>
        </div>

        <Field label="Company" htmlFor={`${id}-company`}>
          <input
            id={`${id}-company`}
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="Type here..."
            className={FIELD}
          />
        </Field>

        <Field label="Budget / range" htmlFor={`${id}-budget`}>
          <div className="relative">
            <select
              id={`${id}-budget`}
              name="budget"
              defaultValue={BUDGETS[0]}
              className={`${FIELD} cursor-pointer appearance-none pr-40`}
            >
              {BUDGETS.map((budget) => (
                <option key={budget}>{budget}</option>
              ))}
            </select>
            <ChevronRightIcon className="pointer-events-none absolute top-1/2 right-16 size-16 -translate-y-1/2 rotate-90" />
          </div>
        </Field>

        <ChipGroup
          legend="What do you need help with?"
          name="help"
          options={HELP_OPTIONS}
          active="peer-checked:bg-action-primary peer-checked:text-on-action"
        />
        <ChipGroup
          legend="Project type"
          name="type"
          options={PROJECT_TYPES}
          active="peer-checked:bg-surface-inverse peer-checked:text-fg-inverse"
        />

        <Field label="What are you trying to improve?" required htmlFor={`${id}-improve`}>
          <textarea
            id={`${id}-improve`}
            name="improve"
            required
            placeholder="Tell us what's happening now, what's getting in the way and what you'd like to change."
            className={`${FIELD} h-auto min-h-104 resize-y py-12`}
          />
        </Field>
      </div>

      {/* Honeypot: off screen and out of the tab order; people never fill it, bots do */}
      <div aria-hidden="true" className="sr-only">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p className="type-body-14 text-fg-primary mt-20">
        Have a brief or supporting files? Send them over when we reply to your message.
      </p>

      <label className="type-body-14 mt-16 flex cursor-pointer items-center gap-12">
        <input
          type="checkbox"
          name="consent"
          required
          className="rounded-12 border-border bg-surface accent-action-primary size-20 shrink-0 cursor-pointer border"
        />
        <span>
          I agree that AWTOMATIG may use the information provided to respond to my inquiry, as described in the{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 transition-colors duration-200 hover:text-black/60 motion-reduce:transition-none"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={pending} className="mt-28">
        {pending ? "Sending…" : "Start the conversation"}
      </Button>
      <p role="status" className="type-body-14 text-fg-primary mt-12 text-center empty:hidden">
        {status.kind === "sent" && "Thanks, your message is on its way. We typically reply within 1 business day."}
        {status.kind === "error" && (
          <>
            {status.message} Please email us at{" "}
            <a href={`mailto:${SITE.email}`} className="underline underline-offset-2">
              {SITE.email}
            </a>
            .
          </>
        )}
      </p>
    </form>
  );
}
