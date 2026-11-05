import { Inject, Injectable, Logger } from "@nestjs/common";

import { AppConfig } from "../config/app-config";
import type { Env } from "../config/env";

const TIMEOUT_MS = 3000;

/** The website's cached lists the backend can ask it to drop. Must match the allow-list in the website's app/api/revalidate. */
export type WebsiteTag = "case-studies" | "testimonials" | "careers" | "site-metrics" | "faqs";

/**
 * Tells the website to drop its cached case studies or testimonials right after a change that affects the live site, so a publish or unpublish
 * shows on the next visit instead of up to a minute later. Server to server with the same shared key the website uses to send
 * inquiries (LEAD_INGEST_KEY). Best effort: the change is already saved, and the website refreshes by itself within a minute
 * anyway, so a failure is logged and never reaches the employee. With WEBSITE_URL unset it does nothing.
 */
@Injectable()
export class WebsiteRevalidator {
  private readonly logger = new Logger(WebsiteRevalidator.name);
  private readonly endpoint: string | null;
  private readonly key: string;

  constructor(@Inject(AppConfig) config: { env: Env }) {
    const base = config.env.WEBSITE_URL;
    this.endpoint = base ? `${base.replace(/\/+$/, "")}/api/revalidate` : null;
    this.key = config.env.LEAD_INGEST_KEY;
  }

  /**
   * Case studies are the website's default: the request carries no tag, so a website that does not know about tags yet (or a
   * backend deployed before it) keeps working.
   */
  caseStudiesChanged(): Promise<void> {
    return this.changed();
  }

  testimonialsChanged(): Promise<void> {
    return this.changed("testimonials");
  }

  /** A trust number was edited (Home, Contact and the cleaning landing page show them). */
  siteMetricsChanged(): Promise<void> {
    return this.changed("site-metrics");
  }

  /** The shared FAQ list changed (every page that shows the shared FAQ section reads it). */
  faqsChanged(): Promise<void> {
    return this.changed("faqs");
  }

  /** The careers list and job pages (a job was published, edited, closed or reopened). */
  careersChanged(): Promise<void> {
    return this.changed("careers");
  }

  private async changed(tag?: WebsiteTag): Promise<void> {
    if (!this.endpoint) return;
    try {
      const response = await fetch(tag ? `${this.endpoint}?tag=${tag}` : this.endpoint, {
        method: "POST",
        headers: { "x-ingest-key": this.key },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok)
        this.logger.warn(`The website refused the refresh request (status ${response.status}); it will catch up within a minute`);
    } catch (error) {
      this.logger.warn(
        `Could not reach the website to refresh it (${error instanceof Error ? error.message : "unknown error"}); it will catch up within a minute`,
      );
    }
  }
}
