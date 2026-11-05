import { Injectable } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { Database } from "../../../shared/db/database";
import { NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { WebsiteRevalidator } from "../../../shared/website/website-revalidator";
import { findSiteMetric, hintFor, SITE_METRICS, type UpdateSiteMetricInput, valueProblem } from "../domain/site-metric";
import { SiteMetricsRepo } from "../repo/site-metrics.repo";

/**
 * Use cases for the website's trust numbers. Permissions are declared on the endpoints (`cms.metric.read` / `.update`). The
 * catalog in the domain says which slots exist; a slot with no saved row shows its default value, so a missing seed never
 * breaks the website. An edit writes an audit entry with the key and the old and new value (figures, not personal data).
 */
@Injectable()
export class SiteMetricsService {
  constructor(
    private readonly database: Database,
    private readonly repo: SiteMetricsRepo,
    private readonly audit: AuditService,
    private readonly website: WebsiteRevalidator,
  ) {}

  /** Every slot in catalog order: its title, where it appears, and the current value. */
  async list() {
    const saved = new Map((await this.repo.all()).map((row) => [row.key, row]));
    return {
      items: SITE_METRICS.map((metric) => {
        const row = saved.get(metric.key);
        return {
          key: metric.key,
          title: metric.title,
          kind: metric.kind,
          hint: hintFor(metric.kind),
          placements: metric.placements,
          value: row?.value ?? metric.defaultValue,
          defaultValue: metric.defaultValue,
          // A seeded row has no `updated_by`: nobody edited it, so it reports "never edited" instead of the seed time.
          updatedAt: row?.updatedBy ? row.updatedAt.toISOString() : null,
          updatedBy: row?.updatedBy ?? null,
        };
      }),
    };
  }

  async update(key: string, input: UpdateSiteMetricInput, actorId: string) {
    const metric = findSiteMetric(key);
    if (!metric) throw new NotFoundError("Site metric not found");
    const problem = valueProblem(metric.kind, input.value);
    if (problem) throw new ValidationError(problem, { value: problem });

    const changed = await this.database.transaction(async (tx) => {
      const previous = (await this.repo.findForUpdate(tx, key))?.value ?? metric.defaultValue;
      if (previous === input.value) return false;
      await this.repo.upsert(tx, key, input.value, actorId);
      await this.audit.record(
        {
          action: "cms.site_metric.updated",
          actorId,
          entityType: "site_metric",
          metadata: { key, from: previous, to: input.value },
        },
        tx,
      );
      return true;
    });
    if (changed) await this.website.siteMetricsChanged();

    const item = (await this.list()).items.find((entry) => entry.key === key);
    return item!;
  }

  /** What the website reads: every key with its current value (the default where nothing is saved). */
  async listPublic(): Promise<Record<string, string>> {
    const saved = new Map((await this.repo.all()).map((row) => [row.key, row.value]));
    return Object.fromEntries(SITE_METRICS.map((metric) => [metric.key, saved.get(metric.key) ?? metric.defaultValue]));
  }
}
