"use client";

import { Button } from "@/components/ui";

/** A failing screen shows one plain message and a retry. The shell around it keeps working. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-12 border-border bg-surface flex flex-col items-center gap-16 border px-20 py-60 text-center">
      <h1 className="type-heading-20 text-fg-strong">Something went wrong</h1>
      <p className="type-body-14 text-fg-muted max-w-440">
        This screen could not be loaded. Try again; if it keeps happening, tell the team.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
