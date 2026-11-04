import "dotenv/config";

import { parseEnv } from "./shared/config/env";
import { createR2Client, StorageService } from "./shared/storage/storage.service";

// Proves the app can use both buckets. Private: uploads a tiny object, signs a link, fetches it, then deletes it.
// Public: uploads a tiny object, loads it from its public URL, refuses to overwrite it, lists and deletes the folder.
// Prints no keys, no bucket names and no URL (a signed link would be a working credential for a few seconds).
//
//   npm run storage:check
async function main(): Promise<void> {
  const config = { env: parseEnv(process.env) };
  const storage = new StorageService(config, createR2Client(config));
  const stamp = Date.now();
  const body = Buffer.from("awtomatig storage check");

  const privateKey = `healthcheck/${stamp}.txt`;
  await storage.put(privateKey, body, "text/plain");
  console.log("ok  private upload");
  try {
    const head = await storage.head(privateKey);
    if (head?.size !== body.length) throw new Error("head did not return the uploaded size");
    console.log("ok  private head");

    const { url, expiresAt } = await storage.signedGetUrl(privateKey, 60);
    const response = await fetch(url);
    if (!response.ok || (await response.text()) !== body.toString()) throw new Error(`signed link returned ${response.status}`);
    console.log(`ok  private signed link (expires ${expiresAt.toISOString()})`);
  } finally {
    await storage.delete(privateKey);
    console.log("ok  private delete");
  }
  if ((await storage.head(privateKey)) !== null) throw new Error("private object still exists after delete");
  console.log("ok  private gone");

  const folder = `healthcheck-public/${stamp}/`;
  const publicKey = `${folder}image1.txt`;
  try {
    if (!(await storage.putPublicIfAbsent(publicKey, body, "text/plain"))) throw new Error("public key was not free");
    console.log("ok  public upload");

    const head = await storage.headPublic(publicKey);
    if (head?.size !== body.length) throw new Error("public head did not return the uploaded size");
    console.log("ok  public head");

    // The base URL is what the website will use for images, so it has to serve the object without any credential.
    const response = await fetch(storage.publicUrl(publicKey));
    if (!response.ok || (await response.text()) !== body.toString()) throw new Error(`public URL returned ${response.status}`);
    console.log("ok  public URL serves the file");

    if (await storage.putPublicIfAbsent(publicKey, Buffer.from("other"), "text/plain"))
      throw new Error("public file was overwritten");
    console.log("ok  public file is never overwritten");

    const keys = await storage.listPublic(folder);
    if (keys.length !== 1 || keys[0] !== publicKey) throw new Error("list did not return the uploaded file");
    console.log("ok  public list");
  } finally {
    await storage.deletePublicPrefix(folder);
    console.log("ok  public delete");
  }
  if ((await storage.listPublic(folder)).length !== 0) throw new Error("public folder is not empty after delete");
  console.log("ok  gone. Storage works.");
}

main().catch((error: unknown) => {
  console.error(`Storage check failed: ${error instanceof Error ? `${error.name}: ${error.message}` : "unknown error"}`);
  process.exitCode = 1;
});
