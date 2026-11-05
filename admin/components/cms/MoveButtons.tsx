"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { IconButton } from "@/components/ui";
import type { MoveOutcome } from "@/lib/cms/reorder";

/**
 * Move up / move down for one row of an ordered list (the website's order of case studies, testimonials). It only draws the
 * buttons and reports the result; `move` does the work against the right endpoint (see `lib/cms/reorder.ts`), which needs the
 * whole order at once because a partial list could shuffle the rest by accident. `label` names the row for screen readers.
 */
export function MoveButtons({
  label,
  canMoveUp,
  canMoveDown,
  move,
}: {
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  move: (direction: -1 | 1) => Promise<MoveOutcome>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(direction: -1 | 1) {
    setPending(true);
    setError(null);
    try {
      const outcome = await move(direction);
      if (outcome.kind === "login") return router.replace("/login");
      if (outcome.kind === "failed") return setError(outcome.message);
      router.refresh();
    } catch {
      setError("Not saved");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-8">
      <IconButton
        label={`Move ${label} up`}
        icon={<ArrowUp strokeWidth={1.5} />}
        disabled={pending || !canMoveUp}
        onClick={() => run(-1)}
      />
      <IconButton
        label={`Move ${label} down`}
        icon={<ArrowDown strokeWidth={1.5} />}
        disabled={pending || !canMoveDown}
        onClick={() => run(1)}
      />
      {error && (
        <span role="alert" className="type-caption-12 text-fg-primary whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
}
