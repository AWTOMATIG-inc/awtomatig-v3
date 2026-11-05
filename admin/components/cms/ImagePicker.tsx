"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { formatFileSize } from "@/lib/format";
import { IMAGE_ACCEPT, imageFileProblem } from "@/lib/cms/image";

interface CurrentImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * Shows the showcase image (the saved one, or the file just chosen) and lets the person pick a file. It only chooses: the
 * parent decides when to upload. The file is checked here for feedback (type, size); the backend checks the real bytes again.
 * To clear the choice from outside, change the `key`.
 */
export function ImagePicker({
  current,
  onFile,
  disabled,
  readOnly,
  error,
}: {
  current?: CurrentImage | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
  /** Only show the saved image: no buttons, no hints. For someone who may look but not change. */
  readOnly?: boolean;
  /** A message from the parent (for example a failed upload), shown with the picker's own checks. */
  error?: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<{ file: File; url: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // Give the temporary preview address back when it is replaced and when the picker goes away.
  useEffect(() => {
    const url = chosen?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [chosen]);

  function choose(file: File | undefined) {
    if (!file) return;
    const message = imageFileProblem(file);
    setProblem(message);
    if (message) {
      onFile(null);
      setChosen(null);
    } else {
      setChosen({ file, url: URL.createObjectURL(file) });
      onFile(file);
    }
    // Choosing the same file twice must still fire a change.
    if (input.current) input.current.value = "";
  }

  function clear() {
    setChosen(null);
    setProblem(null);
    onFile(null);
  }

  const shown = chosen
    ? { url: chosen.url, alt: "Preview of the chosen image" }
    : current
      ? { url: current.url, alt: current.alt }
      : null;
  const message = problem ?? error;

  return (
    <div className="flex flex-col gap-12">
      <div className="rounded-8 border-border bg-surface-subtle relative aspect-4/3 w-full max-w-320 overflow-hidden border">
        {shown ? (
          // `unoptimized`: the image is already on the public bucket (or in this browser), so there is nothing to resize or proxy.
          <Image src={shown.url} alt={shown.alt} fill unoptimized sizes="320px" className="object-contain" />
        ) : (
          <p className="type-body-14 text-fg-muted absolute inset-0 flex items-center justify-center px-16 text-center">
            No image yet
          </p>
        )}
      </div>

      {readOnly ? (
        current && (
          <p className="type-body-14 text-fg-muted">
            Saved image: {current.width} × {current.height} px.
          </p>
        )
      ) : (
        <>
          <input
            ref={input}
            type="file"
            accept={IMAGE_ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => choose(event.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-12">
            <Button variant="outline" disabled={disabled} onClick={() => input.current?.click()}>
              {chosen ? "Choose another" : current ? "Choose a new image" : "Choose image"}
            </Button>
            {chosen && (
              <Button variant="outline" disabled={disabled} onClick={clear}>
                Remove choice
              </Button>
            )}
          </div>
        </>
      )}

      {readOnly ? null : chosen ? (
        <p className="type-body-14 text-fg-muted">
          {chosen.file.name} · {formatFileSize(chosen.file.size)}
        </p>
      ) : current ? (
        <p className="type-body-14 text-fg-muted">
          Saved image: {current.width} × {current.height} px.
        </p>
      ) : null}
      {!readOnly && (
        <p className="type-body-14 text-fg-muted">
          PNG, JPEG or WebP, up to 5 MB. About 551 × 525 px works best; the website rounds the corners.
        </p>
      )}
      {message && (
        <p role="alert" className="type-body-14 text-fg-primary flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
          {message}
        </p>
      )}
    </div>
  );
}
