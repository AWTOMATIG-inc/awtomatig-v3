import "dotenv/config";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool } from "pg";

// Loads the website's nine trust numbers into the database from `seed/site-metrics.sql`. A figure that already has a row is left
// alone, so running it again never undoes an edit made in the admin. Run it after the deploy has migrated the database.
//
//   npm run seed:site-metrics
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to backend/.env.");

  const sql = await readFile(join(__dirname, "..", "seed", "site-metrics.sql"), "utf8");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const before = await pool.query<{ count: string }>("select count(*) from cms.site_metrics");
    await pool.query(sql);
    const after = await pool.query<{ key: string; value: string }>("select key, value from cms.site_metrics order by key");
    const added = after.rowCount! - Number(before.rows[0]!.count);
    console.log(`Site metrics: ${added} added, ${after.rowCount} in total.`);
    for (const row of after.rows) console.log(`  ${row.key.padEnd(26)} ${row.value}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    /relation "cms\.site_metrics" does not exist/.test(message)
      ? "The cms.site_metrics table is missing. Deploy first so the migration runs."
      : message,
  );
  process.exit(1);
});
