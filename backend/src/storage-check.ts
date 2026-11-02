import "dotenv/config";

import { parseEnv } from "./shared/config/env";
import { createR2Client, StorageService } from "./shared/storage/storage.service";

// Proves the app can use the private bucket: uploads a tiny object, signs a link, fetches it, then deletes it.
// Prints no keys, no bucket name and no URL (the signed link would be a working credential for a few seconds).
//
//   npm run storage:check
async function main(): Promise<void> {
  const config = { env: parseEnv(process.env) };
  const storage = new StorageService(config, createR2Client(config));
  const key = `healthcheck/${Date.now()}.txt`;
  const body = Buffer.from("awtomatig storage check");

  await storage.put(key, body, "text/plain");
  console.log("ok  upload");
  try {
    const head = await storage.head(key);
    if (head?.size !== body.length) throw new Error("head did not return the uploaded size");
    console.log("ok  head");

    const { url, expiresAt } = await storage.signedGetUrl(key, 60);
    const response = await fetch(url);
    if (!response.ok || (await response.text()) !== body.toString()) throw new Error(`signed link returned ${response.status}`);
    console.log(`ok  signed link (expires ${expiresAt.toISOString()})`);
  } finally {
    await storage.delete(key);
    console.log("ok  delete");
  }
  if ((await storage.head(key)) !== null) throw new Error("object still exists after delete");
  console.log("ok  gone. Storage works.");
}

main().catch((error: unknown) => {
  console.error(`Storage check failed: ${error instanceof Error ? `${error.name}: ${error.message}` : "unknown error"}`);
  process.exitCode = 1;
});
