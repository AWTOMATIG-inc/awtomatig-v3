import "dotenv/config";

import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { createApp } from "./bootstrap";
import { buildOpenApiDocument } from "./shared/openapi/setup";

// Builds the OpenAPI document without a database or a listening port, and writes it to openapi.json.
// Commit the file: a PR that changes an endpoint shows the contract diff, and frontend/admin generate their client from it.
async function main(): Promise<void> {
  process.env.DATABASE_URL ??= "postgres://export:export@localhost:5432/export";
  process.env.BETTER_AUTH_SECRET ??= "openapi-export-openapi-export-openapi-export";
  process.env.BETTER_AUTH_URL ??= "http://localhost:3001";
  process.env.LEAD_INGEST_KEY ??= "openapi-export-openapi-export-openapi-export";
  process.env.LOG_LEVEL = "silent";
  const app = await createApp();
  await app.init();
  const target = join(__dirname, "..", "openapi.json");
  writeFileSync(target, `${JSON.stringify(buildOpenApiDocument(app), null, 2)}\n`);
  await app.close();
  console.log(`Wrote ${target}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
