import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Each module owns one `schema.ts` (and one Postgres schema); `shared/` may define the `core` tables.
export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/shared/**/*.schema.ts", "./src/modules/*/schema.ts"],
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  migrations: { schema: "drizzle", table: "__migrations" },
  strict: true,
  verbose: true,
});
