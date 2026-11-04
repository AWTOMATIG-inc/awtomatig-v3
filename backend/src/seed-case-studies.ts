import "dotenv/config";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Pool } from "pg";

// Loads the website's first three case studies (Royal Safari Tours, Power Bank Bangladesh, New York Clean Team) into the database
// from `seed/case-studies.sql`. Their images are already in the public bucket, so nothing is uploaded. Safe to run again: a slug
// that already exists is left alone. Run it after the deploy has migrated the database.
//
//   npm run seed:case-studies
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to backend/.env.");

  const sql = await readFile(join(__dirname, "..", "seed", "case-studies.sql"), "utf8");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const before = await pool.query<{ count: string }>("select count(*) from cms.case_studies");
    await pool.query(sql);
    const after = await pool.query<{ slug: string; status: string }>(
      "select slug, status from cms.case_studies order by sort_order",
    );
    const added = after.rowCount! - Number(before.rows[0]!.count);
    console.log(`Case studies: ${added} added, ${after.rowCount} in total.`);
    for (const row of after.rows) console.log(`  ${row.status.padEnd(10)} ${row.slug}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    /relation "cms\.case_studies" does not exist/.test(message)
      ? "The cms.case_studies table is missing. Deploy first so the migration runs."
      : message,
  );
  process.exit(1);
});
