import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";

import { MAX_REORDERABLE } from "./case-studies";

/** What a move came to. `done` also covers "nothing to move" (the neighbour was already gone), so the list just refreshes. */
export type MoveOutcome = { kind: "done" } | { kind: "login" } | { kind: "failed"; message: string };

const done: MoveOutcome = { kind: "done" };
const failed = (message: string): MoveOutcome => ({ kind: "failed", message });

/** The ids with `id` swapped with its neighbour, or null when there is no neighbour that way (or `id` is not in the list). */
export function swapWithNeighbour(ids: readonly string[], id: string, direction: -1 | 1): string[] | null {
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= ids.length) return null;
  const next = [...ids];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/**
 * Moves one case study a place up or down in the website's order. The backend wants the whole order at once, so this reads the
 * full list, swaps the study with its neighbour and sends it back.
 */
export async function moveCaseStudy(id: string, direction: -1 | 1): Promise<MoveOutcome> {
  const current = await api.GET("/api/v1/cms/case-studies", {
    params: { query: { pageSize: MAX_REORDERABLE, sort: "sortOrder", order: "asc" } },
  });
  if (current.response.status === 401) return { kind: "login" };
  if (!current.data) return failed(apiMessage(current.error, "Not saved"));
  if (current.data.total > current.data.items.length) return failed("Too many to reorder here");

  const ids = swapWithNeighbour(
    current.data.items.map((item) => item.id),
    id,
    direction,
  );
  if (!ids) return done;
  const saved = await api.PUT("/api/v1/cms/case-studies/order", { body: { ids } });
  if (saved.response.status === 401) return { kind: "login" };
  if (!saved.response.ok) return failed(saved.response.status === 403 ? "No permission" : "Not saved");
  return done;
}

/** Moves one testimonial a place up or down in the website's order, the same way. */
export async function moveTestimonial(id: string, direction: -1 | 1): Promise<MoveOutcome> {
  const current = await api.GET("/api/v1/cms/testimonials", {
    params: { query: { pageSize: MAX_REORDERABLE, sort: "sortOrder", order: "asc" } },
  });
  if (current.response.status === 401) return { kind: "login" };
  if (!current.data) return failed(apiMessage(current.error, "Not saved"));
  if (current.data.total > current.data.items.length) return failed("Too many to reorder here");

  const ids = swapWithNeighbour(
    current.data.items.map((item) => item.id),
    id,
    direction,
  );
  if (!ids) return done;
  const saved = await api.PUT("/api/v1/cms/testimonials/order", { body: { ids } });
  if (saved.response.status === 401) return { kind: "login" };
  if (!saved.response.ok) return failed(saved.response.status === 403 ? "No permission" : "Not saved");
  return done;
}

/** Moves one FAQ a place up or down in the website's order, the same way. */
export async function moveFaq(id: string, direction: -1 | 1): Promise<MoveOutcome> {
  const current = await api.GET("/api/v1/cms/faqs", {
    params: { query: { pageSize: MAX_REORDERABLE, sort: "sortOrder", order: "asc" } },
  });
  if (current.response.status === 401) return { kind: "login" };
  if (!current.data) return failed(apiMessage(current.error, "Not saved"));
  if (current.data.total > current.data.items.length) return failed("Too many to reorder here");

  const ids = swapWithNeighbour(
    current.data.items.map((item) => item.id),
    id,
    direction,
  );
  if (!ids) return done;
  const saved = await api.PUT("/api/v1/cms/faqs/order", { body: { ids } });
  if (saved.response.status === 401) return { kind: "login" };
  if (!saved.response.ok) return failed(saved.response.status === 403 ? "No permission" : "Not saved");
  return done;
}
