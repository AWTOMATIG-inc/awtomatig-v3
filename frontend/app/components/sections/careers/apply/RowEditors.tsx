"use client";

import type { ReactNode } from "react";
import { Button, Field, FIELD } from "@/app/components/ui";
import { LIMITS, type Education, type Experience, type FieldErrors } from "./application";

// The repeatable Education and Experience rows of the application form. Controlled by the form, which owns the state and the
// errors. Ids are built from the form id, the row's place and the field, so they are stable between server and browser.

const CHECK = "rounded-12 border-border bg-surface accent-action-primary size-20 shrink-0 cursor-pointer border";

function Row({ title, onRemove, children }: { title: string; onRemove?: () => void; children: ReactNode }) {
  return (
    <div className="border-border rounded-12 border p-16 lg:p-20">
      <div className="flex items-center justify-between gap-12">
        <h4 className="type-label-14 uppercase">{title}</h4>
        {onRemove && (
          <Button type="button" variant="outline" size="md" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
      <div className="mt-16 grid gap-16">{children}</div>
    </div>
  );
}

type Common<T> = {
  idPrefix: string;
  rows: (T & { key: string })[];
  errors: FieldErrors;
  onChange: (index: number, patch: Partial<T>) => void;
  onRemove: (index: number) => void;
};

const invalid = (errors: FieldErrors, path: string, id: string) =>
  errors[path] ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};

export function EducationRows({ idPrefix, rows, errors, onChange, onRemove }: Common<Education>) {
  return (
    <div className="grid gap-16">
      {rows.map((row, i) => {
        const id = (field: string) => `${idPrefix}-edu-${i}-${field}`;
        const path = (field: string) => `educations.${i}.${field}`;
        const err = (field: string) => errors[path(field)];
        return (
          <Row key={row.key} title={`Education ${i + 1}`} onRemove={rows.length > 1 ? () => onRemove(i) : undefined}>
            <Field label="Degree" required htmlFor={id("degree")} error={err("degree")}>
              <input
                id={id("degree")}
                type="text"
                required
                maxLength={LIMITS.text}
                placeholder="e.g. Bachelor of Science"
                value={row.degree}
                onChange={(e) => onChange(i, { degree: e.target.value })}
                className={FIELD}
                {...invalid(errors, path("degree"), id("degree"))}
              />
            </Field>
            <div className="grid gap-16 sm:grid-cols-2">
              <Field label="Field of study" required htmlFor={id("field")} error={err("fieldOfStudy")}>
                <input
                  id={id("field")}
                  type="text"
                  required
                  maxLength={LIMITS.text}
                  placeholder="e.g. Computer Science and Engineering"
                  value={row.fieldOfStudy}
                  onChange={(e) => onChange(i, { fieldOfStudy: e.target.value })}
                  className={FIELD}
                  {...invalid(errors, path("fieldOfStudy"), id("field"))}
                />
              </Field>
              <Field label="Institution" required htmlFor={id("institution")} error={err("institution")}>
                <input
                  id={id("institution")}
                  type="text"
                  required
                  maxLength={LIMITS.text}
                  placeholder="School, college or university"
                  value={row.institution}
                  onChange={(e) => onChange(i, { institution: e.target.value })}
                  className={FIELD}
                  {...invalid(errors, path("institution"), id("institution"))}
                />
              </Field>
            </div>
            <div className="grid gap-16 sm:grid-cols-2">
              <Field label="Completed on" required={!row.ongoing} htmlFor={id("completed")} error={err("completedOn")}>
                <input
                  id={id("completed")}
                  type="date"
                  required={!row.ongoing}
                  disabled={row.ongoing}
                  value={row.completedOn}
                  onChange={(e) => onChange(i, { completedOn: e.target.value })}
                  className={`${FIELD} disabled:cursor-not-allowed disabled:opacity-40`}
                  {...invalid(errors, path("completedOn"), id("completed"))}
                />
              </Field>
              <Field label="Grade (optional)" htmlFor={id("grade")} error={err("grade")}>
                <input
                  id={id("grade")}
                  type="text"
                  maxLength={LIMITS.grade}
                  placeholder="e.g. CGPA 3.6 / 4.0"
                  value={row.grade}
                  onChange={(e) => onChange(i, { grade: e.target.value })}
                  className={FIELD}
                  {...invalid(errors, path("grade"), id("grade"))}
                />
              </Field>
            </div>
            <label className="type-body-14 flex cursor-pointer items-center gap-12">
              <input
                type="checkbox"
                checked={row.ongoing}
                onChange={(e) => onChange(i, { ongoing: e.target.checked, ...(e.target.checked && { completedOn: "" }) })}
                className={CHECK}
              />
              I am still studying here (ongoing)
            </label>
          </Row>
        );
      })}
    </div>
  );
}

export function ExperienceRows({ idPrefix, rows, errors, onChange, onRemove }: Common<Experience>) {
  return (
    <div className="grid gap-16">
      {rows.map((row, i) => {
        const id = (field: string) => `${idPrefix}-exp-${i}-${field}`;
        const path = (field: string) => `experiences.${i}.${field}`;
        const err = (field: string) => errors[path(field)];
        return (
          <Row key={row.key} title={`Experience ${i + 1}`} onRemove={() => onRemove(i)}>
            <div className="grid gap-16 sm:grid-cols-2">
              <Field label="Company" required htmlFor={id("company")} error={err("company")}>
                <input
                  id={id("company")}
                  type="text"
                  required
                  maxLength={LIMITS.text}
                  value={row.company}
                  onChange={(e) => onChange(i, { company: e.target.value })}
                  className={FIELD}
                  {...invalid(errors, path("company"), id("company"))}
                />
              </Field>
              <Field label="Job title" required htmlFor={id("title")} error={err("title")}>
                <input
                  id={id("title")}
                  type="text"
                  required
                  maxLength={LIMITS.text}
                  value={row.title}
                  onChange={(e) => onChange(i, { title: e.target.value })}
                  className={FIELD}
                  {...invalid(errors, path("title"), id("title"))}
                />
              </Field>
            </div>
            <div className="grid gap-16 sm:grid-cols-2">
              <Field label="From" required htmlFor={id("from")} error={err("fromOn")}>
                <input
                  id={id("from")}
                  type="date"
                  required
                  value={row.fromOn}
                  onChange={(e) => onChange(i, { fromOn: e.target.value })}
                  className={FIELD}
                  {...invalid(errors, path("fromOn"), id("from"))}
                />
              </Field>
              <Field label="To" required={!row.current} htmlFor={id("to")} error={err("toOn")}>
                <input
                  id={id("to")}
                  type="date"
                  required={!row.current}
                  disabled={row.current}
                  value={row.toOn}
                  onChange={(e) => onChange(i, { toOn: e.target.value })}
                  className={`${FIELD} disabled:cursor-not-allowed disabled:opacity-40`}
                  {...invalid(errors, path("toOn"), id("to"))}
                />
              </Field>
            </div>
            <label className="type-body-14 flex cursor-pointer items-center gap-12">
              <input
                type="checkbox"
                checked={row.current}
                onChange={(e) => onChange(i, { current: e.target.checked, ...(e.target.checked && { toOn: "" }) })}
                className={CHECK}
              />
              I currently work here
            </label>
            <Field label="Responsibilities" required htmlFor={id("resp")} error={err("responsibilities")}>
              <textarea
                id={id("resp")}
                required
                maxLength={LIMITS.answer}
                placeholder="What did you work on, and what did you deliver?"
                value={row.responsibilities}
                onChange={(e) => onChange(i, { responsibilities: e.target.value })}
                className={`${FIELD} h-auto min-h-104 resize-y py-12`}
                {...invalid(errors, path("responsibilities"), id("resp"))}
              />
            </Field>
          </Row>
        );
      })}
    </div>
  );
}
