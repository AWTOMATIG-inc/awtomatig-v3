import { index, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { newId } from "../db/columns";
import { coreSchema } from "../db/core-schema";

/**
 * Append-only record of who did what. `actor_id` is a user id with no foreign key on purpose: the log must outlive a
 * deleted user. Never put secrets, passwords or free-form personal data in `metadata`.
 */
export const auditLog = coreSchema.table(
  "audit_log",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    actorId: uuid("actor_id"),
    /** `domain.action`, for example `auth.sign_in`. */
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [index("audit_log_occurred_at_idx").on(table.occurredAt), index("audit_log_actor_id_idx").on(table.actorId)],
);
