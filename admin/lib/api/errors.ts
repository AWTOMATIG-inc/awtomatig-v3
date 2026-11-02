/**
 * The backend's one error shape is `{ code, message, details? }`. These two helpers are the shared place that reads it, so a
 * screen never shows a raw error and never guesses at the structure.
 */

/** The backend's own message when it sent one (they are written for people), otherwise the fallback. */
export function apiMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: unknown } | null | undefined)?.message;
  return typeof message === "string" && message ? message : fallback;
}

/**
 * Field errors by field path, so a form can show each one next to its field. Accepts both shapes the backend uses: a list of
 * `{ path, message }` (request validation) and an object of `field: message` (a rule checked by a use case).
 */
export function apiFieldErrors(error: unknown): Record<string, string> {
  const details = (error as { details?: unknown } | null | undefined)?.details;
  const errors: Record<string, string> = {};
  if (Array.isArray(details)) {
    for (const item of details as unknown[]) {
      const { path, message } = (item ?? {}) as { path?: unknown; message?: unknown };
      if (typeof path === "string" && typeof message === "string" && !(path in errors)) errors[path] = message;
    }
  } else if (details && typeof details === "object") {
    for (const [field, message] of Object.entries(details)) {
      if (typeof message === "string") errors[field] = message;
    }
  }
  return errors;
}
