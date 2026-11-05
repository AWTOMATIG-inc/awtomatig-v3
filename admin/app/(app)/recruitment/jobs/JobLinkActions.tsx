"use client";

import { Check, Link2, SquareArrowOutUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { jobPublicUrl } from "@/lib/config";

/**
 * "Open" (the careers page in a new tab) and "Share link" (copies its address) for one opening. A draft has no public page yet, so it
 * gets neither. The copy button says "Copied" for two seconds, or "Not copied" when the browser refuses.
 */
export function JobLinkActions({ slug, draft }: { slug: string; draft: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  if (draft) return <span className="text-fg-muted whitespace-nowrap">Publish to share</span>;
  const url = jobPublicUrl(slug);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="flex items-center gap-8">
      <Button
        size="sm"
        variant="outline"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        icon={<SquareArrowOutUpRight strokeWidth={1.5} />}
      >
        Open
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={copy}
        icon={state === "copied" ? <Check strokeWidth={1.5} /> : <Link2 strokeWidth={1.5} />}
      >
        {state === "copied" ? "Copied" : state === "failed" ? "Not copied" : "Share link"}
      </Button>
      <span className="sr-only" role="status">
        {state === "copied" ? "Link copied" : state === "failed" ? "Could not copy the link" : ""}
      </span>
    </div>
  );
}
