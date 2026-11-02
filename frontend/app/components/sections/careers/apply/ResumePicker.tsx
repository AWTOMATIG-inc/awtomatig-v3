"use client";

import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/app/components/ui";
import { UploadCloudIcon } from "@/app/components/icons";

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// The tile shows the real extension, so a wrong file type is visible at a glance
const extension = (name: string) =>
  (name.includes(".") ? (name.split(".").pop() ?? "").slice(0, 4).toUpperCase() : "FILE") || "FILE";

type Props = {
  id: string;
  resume: File | null;
  error?: string;
  /** Called with the chosen or dropped file, or null when it is removed. The form validates it. */
  onPick: (file: File | null) => void;
};

// The resume field of the application form: a full-width drop zone that becomes a file row (name, size, Replace, Remove) once a
// PDF is chosen. The real file input is visually hidden and driven by the buttons, so keyboard and screen readers keep working.
export default function ResumePicker({ id, resume, error, onPick }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const choose = () => inputRef.current?.click();
  const remove = () => {
    onPick(null);
    // The Remove button disappears with the file, so hand focus to the Choose button that takes its place
    requestAnimationFrame(() => boxRef.current?.querySelector("button")?.focus());
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onPick(file);
  };

  const state = error
    ? "border-status-warning bg-surface-subtle"
    : dragging
      ? "border-action-primary bg-action-primary/12"
      : "border-black/20 bg-surface-subtle";

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-label="Resume (PDF), required"
        aria-required="true"
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null);
          // Choosing the same file again after fixing it must still fire a change
          e.target.value = "";
        }}
      />

      <div
        ref={boxRef}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-12 w-full border border-dashed p-20 transition-colors duration-200 motion-reduce:transition-none lg:p-24 ${state}`}
      >
        {resume ? (
          <div className="flex flex-col gap-16 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-16">
              <span
                aria-hidden="true"
                className="bg-surface-inverse text-fg-inverse type-label-12 rounded-8 grid size-44 shrink-0 place-items-center"
              >
                {extension(resume.name)}
              </span>
              <div className="min-w-0">
                <p className="type-body-14 font-medium break-all">{resume.name}</p>
                <p className="type-caption-12 text-fg-muted mt-4">{formatSize(resume.size)}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-8">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={choose}
                data-invalid={error ? "true" : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
              >
                Replace
              </Button>
              <Button type="button" variant="dark" size="md" onClick={remove} aria-label={`Remove ${resume.name}`}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12 py-8 text-center">
            <UploadCloudIcon aria-hidden="true" className="size-32" />
            <div>
              <p className="type-body-14 font-medium">Drag and drop your resume here</p>
              <p className="type-caption-12 text-fg-muted mt-4">Required. PDF only, up to 5 MB</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={choose}
              data-invalid={error ? "true" : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
            >
              Choose PDF
            </Button>
          </div>
        )}
      </div>

      <p className="sr-only" role="status">
        {resume ? `${resume.name} selected` : "No resume selected"}
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="type-caption-12 text-fg-strong mt-8 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
