import type { IncomingHttpHeaders } from "node:http";

/** Fastify's header object as the Web `Headers` Better Auth expects. */
export function toHeaders(source: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(source)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) headers.append(name, item);
  }
  return headers;
}
