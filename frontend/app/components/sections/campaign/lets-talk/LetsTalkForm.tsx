"use client";

import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { ChevronRightIcon } from "@/app/components/icons";
import { Button, Field, FIELD } from "@/app/components/ui";
import { SITE } from "@/lib/site";
import { CAMPAIGN_PROJECT_TYPES, CAMPAIGN_SERVICES } from "../../shared/inquiry/inquiry";
import { sendInquiry } from "../../shared/inquiry/sendInquiry";

// The design has no budget field; the action needs one of its known values
const NO_BUDGET = "Not sure yet";

type Status = { kind: "idle" } | { kind: "sent" } | { kind: "error"; message: string };

// Campaign page inquiry form: the Contact page's `sendInquiry` Server Action (CRM, team email, visitor confirmation),
// with the cleaning-sector service and project lists. Submitting by hand keeps the fields filled if sending fails.
export default function LetsTalkForm() {
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
          form_id: "campaign_inquiry",
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
    <form id="get-started" onSubmit={onSubmit} className="rounded-16 bg-surface text-fg-strong scroll-mt-120 p-20 lg:p-28">
      <div className="grid gap-20">
        <div className="grid gap-20 sm:grid-cols-2 sm:gap-16">
          <Field label="Your name" required htmlFor={`${id}-name`}>
            <input
              id={`${id}-name`}
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Your full name"
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
              placeholder="Your work email"
              className={FIELD}
            />
          </Field>
        </div>

        <div className="grid gap-20 sm:grid-cols-2 sm:gap-16">
          <Field label="Company" htmlFor={`${id}-company`}>
            <input
              id={`${id}-company`}
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Your company name"
              className={FIELD}
            />
          </Field>
          <Field label="Service interest" required htmlFor={`${id}-service`}>
            <div className="relative">
              <select
                id={`${id}-service`}
                name="help"
                required
                defaultValue=""
                className={`${FIELD} cursor-pointer appearance-none pr-40`}
              >
                <option value="" disabled>
                  Select a service
                </option>
                {CAMPAIGN_SERVICES.map((service) => (
                  <option key={service}>{service}</option>
                ))}
              </select>
              <ChevronRightIcon className="pointer-events-none absolute top-1/2 right-16 size-16 -translate-y-1/2 rotate-90" />
            </div>
          </Field>
        </div>

        <Field label="Project type" required htmlFor={`${id}-type`}>
          <div className="relative">
            <select
              id={`${id}-type`}
              name="type"
              required
              defaultValue=""
              className={`${FIELD} cursor-pointer appearance-none pr-40`}
            >
              <option value="" disabled>
                Select a project type
              </option>
              {CAMPAIGN_PROJECT_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <ChevronRightIcon className="pointer-events-none absolute top-1/2 right-16 size-16 -translate-y-1/2 rotate-90" />
          </div>
        </Field>

        <Field label="Message" htmlFor={`${id}-improve`}>
          <textarea
            id={`${id}-improve`}
            name="improve"
            placeholder="What would you like to improve? Tell us about your current setup."
            className={`${FIELD} h-auto min-h-104 resize-y py-12`}
          />
        </Field>
      </div>

      <input type="hidden" name="budget" value={NO_BUDGET} />
      <input type="hidden" name="source" value="cleaning-company-solutions" />

      {/* Honeypot: off screen and out of the tab order; people never fill it, bots do */}
      <div aria-hidden="true" className="sr-only">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="type-body-14 mt-16 flex cursor-pointer items-center gap-12">
        <input
          type="checkbox"
          name="consent"
          required
          className="rounded-12 border-border bg-surface accent-action-primary size-20 shrink-0 cursor-pointer border"
        />
        <span>
          I agree that AWTOMATIG may use my details to respond to this enquiry.{" "}
          <a href="/privacy" target="_blank" className="underline underline-offset-2">
            Privacy Policy
          </a>
        </span>
      </label>

      <Button type="submit" variant="primary" size="lg" fullWidth disabled={pending} className="mt-32">
        {pending ? "Sending…" : "Send my enquiry"}
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
