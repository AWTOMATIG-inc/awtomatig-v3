"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { IconButton } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import { MAX_REORDERABLE } from "@/lib/cms/case-studies";

/**
 * Moves one case study a place up or down in the website's order. The backend wants the whole order at once (a partial list
 * could shuffle the rest by accident), so a click reads the full list, swaps this study with its neighbour and sends it back.
 */
export function MoveButtons({
  id,
  title,
  canMoveUp,
  canMoveDown,
}: {
  id: string;
  title: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(direction: -1 | 1) {
    setPending(true);
    setError(null);
    try {
      const current = await api.GET("/api/v1/cms/case-studies", {
        params: { query: { pageSize: MAX_REORDERABLE, sort: "sortOrder", order: "asc" } },
      });
      if (current.response.status === 401) return router.replace("/login");
      if (!current.data) return setError(apiMessage(current.error, "Not saved"));
      if (current.data.total > current.data.items.length) return setError("Too many to reorder here");

      const ids = current.data.items.map((item) => item.id);
      const from = ids.indexOf(id);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= ids.length) return router.refresh();
      [ids[from], ids[to]] = [ids[to]!, ids[from]!];

      const saved = await api.PUT("/api/v1/cms/case-studies/order", { body: { ids } });
      if (saved.response.status === 401) return router.replace("/login");
      if (!saved.response.ok) {
        return setError(saved.response.status === 403 ? "No permission" : "Not saved");
      }
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
        label={`Move ${title} up`}
        icon={<ArrowUp strokeWidth={1.5} />}
        disabled={pending || !canMoveUp}
        onClick={() => move(-1)}
      />
      <IconButton
        label={`Move ${title} down`}
        icon={<ArrowDown strokeWidth={1.5} />}
        disabled={pending || !canMoveDown}
        onClick={() => move(1)}
      />
      {error && (
        <span role="alert" className="type-caption-12 text-fg-primary whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
}
