import { boolean, index, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "../auth/auth.schema";
import { newId } from "../db/columns";
import { coreSchema } from "../db/core-schema";

/** Roles are data, so they can change without a deploy. A permission is `module.resource.action`; `*` means everything. */
export const roles = coreSchema.table(
  "roles",
  {
    id: uuid("id").primaryKey().$defaultFn(newId),
    name: text("name").notNull(),
    description: text("description"),
    /** System roles (admin) are created by the seed and cannot be deleted from the UI. */
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("roles_name_key").on(table.name)],
);

export const rolePermissions = coreSchema.table(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permission] })],
);

export const userRoles = coreSchema.table(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] }), index("user_roles_role_id_idx").on(table.roleId)],
);
