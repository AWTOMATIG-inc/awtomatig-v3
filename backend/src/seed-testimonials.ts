import "dotenv/config";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool } from "pg";

// Loads the website's six client testimonials (Smith Lake, Objective Focus, Zenithics Global, No Spain No Gain, Sell My Rig, We
// Watch) into the database from `seed/testimonials.sql`. Their logos are already in the public bucket, so nothing is uploaded.
// Safe to run again: a row whose id already exists is left alone. Run it after the deploy has migrated the database.
//
//   npm run seed:testimonials
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to backend/.env.");

  const sql = await readFile(join(__dirname, "..", "seed", "testimonials.sql"), "utf8");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const before = await pool.query<{ count: string }>("select count(*) from cms.testimonials");
    await pool.query(sql);
    const after = await pool.query<{ company: string; status: string }>(
      "select company, status from cms.testimonials order by sort_order",
    );
    const added = after.rowCount! - Number(before.rows[0]!.count);
    console.log(`Testimonials: ${added} added, ${after.rowCount} in total.`);
    for (const row of after.rows) console.log(`  ${row.status.padEnd(10)} ${row.company}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    /relation "cms\.testimonials" does not exist/.test(message)
      ? "The cms.testimonials table is missing. Deploy first so the migration runs."
      : message,
  );
  process.exit(1);
});
