"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/app/components/ui";
import { ChevronRightIcon, UploadCloudIcon } from "@/app/components/icons";
import { BUDGETS, HELP_OPTIONS, PROJECT_TYPES } from "./inquiry";

const FIELD =
  "type-body-14 h-48 w-full rounded-8 bg-surface-subtle px-16 text-fg-strong placeholder:text-black/40 transition-colors duration-200 hover:bg-off-white focus-visible:bg-off-white motion-reduce:transition-none";
const LABEL = "type-caption-12 block font-medium uppercase";

const CHIP_BASE =
  "type-body-14 inline-flex h-41 cursor-pointer items-center rounded-12 px-24 transition-colors duration-200 select-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary motion-reduce:transition-none";

function Required() {
  return (
    <span aria-hidden="true" className="text-status-warning">
      {" "}
      *
    </span>
  );
}

function Field({ label, required, children, htmlFor }: { label: string; required?: boolean; children: ReactNode; htmlFor: string }) {
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

// Project inquiry form (Contact page). There is no backend yet: a valid submit only shows the confirmation line.
export default function InquiryForm() {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-16 bg-surface p-20 lg:p-28">
      <h3 className="type-heading-28">Tell us about the project</h3>

      <div className="mt-20 grid gap-20">
        <div className="grid gap-20 sm:grid-cols-2 sm:gap-16">
          <Field label="Your name" required htmlFor={`${id}-name`}>
            <input id={`${id}-name`} name="name" type="text" required autoComplete="name" placeholder="Type here..." className={FIELD} />
          </Field>
          <Field label="Work email" required htmlFor={`${id}-email`}>
            <input id={`${id}-email`} name="email" type="email" required autoComplete="email" placeholder="Type here..." className={FIELD} />
          </Field>
        </div>

        <Field label="Company" htmlFor={`${id}-company`}>
          <input id={`${id}-company`} name="company" type="text" autoComplete="organization" placeholder="Type here..." className={FIELD} />
        </Field>

        <Field label="Budget / range" htmlFor={`${id}-budget`}>
          <div className="relative">
            <select id={`${id}-budget`} name="budget" defaultValue={BUDGETS[0]} className={`${FIELD} cursor-pointer appearance-none pr-40`}>
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

      <div className="mt-20 flex flex-col gap-16 rounded-8 border border-dashed border-warning/20 bg-warning/12 p-16 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-16">
          <UploadCloudIcon className="size-28 shrink-0 text-status-warning" />
          <div>
            <p className="type-label-14">Have something useful to share?</p>
            <p className="type-body-14 mt-2 text-fg-primary">{fileName || "Upload brief, requirements or supporting files."}</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          name="files"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload files"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            setFileName(files.length > 1 ? `${files.length} files selected` : (files[0]?.name ?? ""));
          }}
        />
        <Button type="button" variant="light" size="card" className="sm:w-134" onClick={() => fileRef.current?.click()}>
          Upload file
        </Button>
      </div>

      <label className="type-body-14 mt-16 flex cursor-pointer items-center gap-12">
        <input
          type="checkbox"
          name="consent"
          required
          className="size-20 shrink-0 cursor-pointer rounded-12 border border-border bg-surface accent-action-primary"
        />
        I agree that AWTOMATIG may use the information provided to respond to my inquiry.
      </label>

      <Button type="submit" variant="primary" size="lg" fullWidth className="mt-28">
        Start the conversation
      </Button>
      {sent && (
        <p role="status" className="type-body-14 mt-12 text-center text-fg-primary">
          Thanks, we’ve got your message and will reply within 1 business day.
        </p>
      )}
    </form>
  );
}
