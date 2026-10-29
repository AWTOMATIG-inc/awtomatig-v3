import { Injectable, Logger } from "@nestjs/common";

import { Database, type DbExecutor } from "../db/database";
import { auditLog } from "./audit.schema";

export interface AuditEntry {
  /** `domain.action`, for example `auth.sign_in`. */
  action: string;
  actorId?: string | null;
  entityType?: string;
  entityId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Ids and codes only. Never secrets, passwords or free-form personal data. */
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly database: Database) {}

  /** Pass the transaction as `executor` when the entry must commit or roll back together with the change it describes. */
  async record(entry: AuditEntry, executor: DbExecutor = this.database.db): Promise<void> {
    await executor.insert(auditLog).values({
      action: entry.action,
      actorId: entry.actorId ?? null,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent?.slice(0, 255) ?? null,
      metadata: entry.metadata ?? null,
    });
  }

  /** For sign-in events: a failed audit write must never block (or reveal anything about) a login, so it is only logged. */
  async recordQuietly(entry: AuditEntry): Promise<void> {
    try {
      await this.record(entry);
    } catch (error) {
      this.logger.error(`Audit write failed for ${entry.action}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
