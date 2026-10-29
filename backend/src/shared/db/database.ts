import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
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
export class Database implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Database.name);
  private readonly target: string;
  readonly pool: Pool;
  readonly db;

  constructor(config: AppConfig) {
    // host:port/database for the log line. The password is never part of it.
    const url = new URL(config.env.DATABASE_URL);
    this.target = `${url.hostname}:${url.port || "5432"}${url.pathname}`;
    this.pool = new Pool({
      connectionString: config.env.DATABASE_URL,
      max: config.env.DATABASE_POOL_MAX,
      connectionTimeoutMillis: 5_000,
    });
    // An idle client can fail (database restart). Log it instead of crashing the process.
    this.pool.on("error", (error) => this.logger.error(`Idle PostgreSQL client error: ${error.message}`));
    this.db = drizzle({ client: this.pool });
  }

  /**
   * Opens a connection at startup so a bad URL, password or database shows up in the log right away, not on the first
   * request. A failure is logged and the app keeps running: `/api/v1/health/ready` reports the database as unreachable
   * until it recovers.
   */
  async onModuleInit(): Promise<void> {
    try {
      const { rows } = await this.pool.query<{ version: string }>("select version()");
      const version = rows[0]?.version.split(" ").slice(0, 2).join(" ").replace(/,$/, "") ?? "PostgreSQL";
      this.logger.log(`Database connected: ${this.target} (${version})`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database connection failed: ${this.target}: ${reason}`);
    }
  }

  /** Runs `work` in one transaction: it commits when `work` resolves and rolls back when it throws. */
  transaction<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.transaction(work);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
