import { Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { AppConfig } from "../config/app-config";

/** The query builder, or the transaction object inside `Database.transaction`. Repos accept either. */
export type Db = Database["db"];
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbExecutor = Db | Tx;

/**
 * The one PostgreSQL connection pool. The client is created without a schema on purpose: each module's repo imports
 * its own tables, so no module can reach another module's tables through a shared object.
 */
@Injectable()
export class Database implements OnModuleDestroy {
  private readonly logger = new Logger(Database.name);
  readonly pool: Pool;
  readonly db;

  constructor(config: AppConfig) {
    this.pool = new Pool({
      connectionString: config.env.DATABASE_URL,
      max: config.env.DATABASE_POOL_MAX,
      connectionTimeoutMillis: 5_000,
    });
    // An idle client can fail (database restart). Log it instead of crashing the process.
    this.pool.on("error", (error) => this.logger.error(`Idle PostgreSQL client error: ${error.message}`));
    this.db = drizzle({ client: this.pool });
  }

  /** Runs `work` in one transaction: it commits when `work` resolves and rolls back when it throws. */
  transaction<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.transaction(work);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
