import { createHash, timingSafeEqual } from "node:crypto";

import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { AppConfig } from "../../../shared/config/app-config";
import { UnauthorizedError } from "../../../shared/errors/app-error";

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Only the website's server may add leads. It sends the shared `LEAD_INGEST_KEY` in the `x-ingest-key` header; without it
 * anyone who found the URL could fill the CRM with junk. Compared in constant time.
 */
@Injectable()
export class LeadIngestGuard implements CanActivate {
  constructor(private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const header = context.switchToHttp().getRequest<FastifyRequest>().headers["x-ingest-key"];
    const sent = Array.isArray(header) ? header[0] : header;
    if (!sent || !timingSafeEqual(digest(sent), digest(this.config.env.LEAD_INGEST_KEY))) {
      throw new UnauthorizedError("A valid ingest key is required");
    }
    return true;
  }
}
