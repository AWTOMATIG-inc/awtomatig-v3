import { pgSchema } from "drizzle-orm/pg-core";

/** The `core` Postgres schema: users, sessions, roles and the audit log. Business modules may reference it (RULES.md section 2). */
export const coreSchema = pgSchema("core");
