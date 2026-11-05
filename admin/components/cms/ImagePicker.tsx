"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { IMAGE_ACCEPT, imageFileProblem } from "@/lib/cms/image";
import { formatFileSize } from "@/lib/format";

interface CurrentImage {
  url: string;
  /** The saved description, when the image has one (a logo does not: the company name serves). */
  alt?: string;
  width: number;
  height: number;
}

/**
 * Shows an image (the saved one, or the file just chosen) and lets the person pick a file. It only chooses: the parent decides
 * when to upload. The file is checked here for feedback (type, size); the backend checks the real bytes again. To clear the
 * choice from outside, change the `key`.
 *
 * `variant="photo"` is a showcase picture on a soft 4:3 frame. `variant="logo"` previews a logo the way the website draws it,
 * on a white card with room around it; `blackLogo` draws it in black like the website does for a white or very light logo.
 */
export function ImagePicker({
  current,
  onFile,
  disabled,
  readOnly,
  error,
  variant = "photo",
  blackLogo,
  noun = "image",
  hint,
}: {
  current?: CurrentImage | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
  /** Only show the saved image: no buttons, no hints. For someone who may look but not change. */
  readOnly?: boolean;
  /** A message from the parent (for example a failed upload), shown with the picker's own checks. */
  error?: string | null;
  variant?: "photo" | "logo";
  blackLogo?: boolean;
  /** What the picture is called in the buttons and the empty frame: "image" or "logo". */
  noun?: string;
  /** The line under the buttons: accepted types and the size that works best. */
  hint?: string;
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
    ? { url: chosen.url, alt: `Preview of the chosen ${noun}` }
    : current
      ? { url: current.url, alt: current.alt ?? `Saved ${noun}` }
      : null;
  const message = problem ?? error;
  const logo = variant === "logo";

  return (
    <div className="flex flex-col gap-12">
      <div
        className={cn(
          "rounded-8 border-border relative w-full max-w-320 overflow-hidden border",
          logo ? "bg-surface aspect-16/7" : "bg-surface-subtle aspect-4/3",
        )}
      >
        {shown ? (
          // `unoptimized`: the image is already on the public bucket (or in this browser), so there is nothing to resize or proxy.
          <Image
            src={shown.url}
            alt={shown.alt}
            fill
            unoptimized
            sizes="320px"
            className={cn("object-contain", logo && "p-24", logo && blackLogo && "brightness-0")}
          />
        ) : (
          <p className="type-body-14 text-fg-muted absolute inset-0 flex items-center justify-center px-16 text-center">
            No {noun} yet
          </p>
        )}
      </div>

      {readOnly ? (
        current && (
          <p className="type-body-14 text-fg-muted">
            Saved {noun}: {current.width} × {current.height} px.
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
              {chosen ? "Choose another" : current ? `Choose a new ${noun}` : `Choose ${noun}`}
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
          Saved {noun}: {current.width} × {current.height} px.
        </p>
      ) : null}
      {!readOnly && hint && <p className="type-body-14 text-fg-muted">{hint}</p>}
      {message && (
        <p role="alert" className="type-body-14 text-fg-primary flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
          {message}
        </p>
      )}
    </div>
  );
}
