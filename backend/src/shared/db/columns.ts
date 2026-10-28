import { numeric, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/** A new UUIDv7 (time-ordered, so inserts stay index-friendly). Use for every primary key. */
export function newId(): string {
  return uuidv7();
}

/** `id`, `created_at`, `updated_at`: every table has these (RULES.md section 3). */
export const baseColumns = {
  id: uuid("id").primaryKey().$defaultFn(newId),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** `created_by` / `updated_by`: add to business tables. They hold a user id from `core.users`, with no cross-schema FK yet. */
export const authorColumns = {
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

/** Money is `numeric(19,4)`, never a float. Store the currency in a column next to it. */
export const money = (name: string) => numeric(name, { precision: 19, scale: 4 });
