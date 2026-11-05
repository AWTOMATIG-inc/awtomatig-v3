import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { Database, type DbExecutor } from "../../../shared/db/database";
import { siteMetrics } from "../schema";

const columns = {
  key: siteMetrics.key,
  value: siteMetrics.value,
  updatedAt: siteMetrics.updatedAt,
  updatedBy: siteMetrics.updatedBy,
};

export interface SiteMetricRow {
  key: string;
  value: string;
  updatedAt: Date;
  updatedBy: string | null;
}

/** The only place that reads or writes `cms.site_metrics`. */
@Injectable()
export class SiteMetricsRepo {
  constructor(private readonly database: Database) {}

  all(): Promise<SiteMetricRow[]> {
    return this.database.db.select(columns).from(siteMetrics);
  }

  /** Locks the row (when it exists) so two edits of the same figure cannot interleave. */
  async findForUpdate(executor: DbExecutor, key: string): Promise<SiteMetricRow | undefined> {
    const [row] = await executor.select(columns).from(siteMetrics).where(eq(siteMetrics.key, key)).for("update");
    return row;
  }

  /** Sets the value, creating the row if the seed has not been run yet. */
  async upsert(executor: DbExecutor, key: string, value: string, actorId: string): Promise<void> {
    await executor
      .insert(siteMetrics)
      .values({ key, value, updatedBy: actorId })
      .onConflictDoUpdate({ target: siteMetrics.key, set: { value, updatedAt: new Date(), updatedBy: actorId } });
  }
}
