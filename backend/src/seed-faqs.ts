import "dotenv/config";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool } from "pg";

// Loads the six FAQs the Contact page showed before the CMS into the database from `seed/faqs.sql`. Safe to run again: a row whose
// id already exists is left alone, so an edit made in the admin is never overwritten. Run it after the deploy has migrated the database.
//
//   npm run seed:faqs
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to backend/.env.");

  const sql = await readFile(join(__dirname, "..", "seed", "faqs.sql"), "utf8");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const before = await pool.query<{ count: string }>("select count(*) from cms.faqs");
    await pool.query(sql);
    const after = await pool.query<{ question: string; status: string }>(
      "select question, status from cms.faqs order by sort_order",
    );
    const added = after.rowCount! - Number(before.rows[0]!.count);
    console.log(`FAQs: ${added} added, ${after.rowCount} in total.`);
    for (const row of after.rows) console.log(`  ${row.status.padEnd(10)} ${row.question}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    /relation "cms\.faqs" does not exist/.test(message)
      ? "The cms.faqs table is missing. Deploy first so the migration runs."
      : message,
  );
  process.exit(1);
});
