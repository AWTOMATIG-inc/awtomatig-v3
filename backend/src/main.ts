import "dotenv/config";

import { Logger } from "nestjs-pino";

import { createApp } from "./bootstrap";
import { parseEnv } from "./shared/config/env";

async function main(): Promise<void> {
  const env = parseEnv(process.env);
  const app = await createApp();
  await app.listen(env.PORT, env.HOST);
  app.get(Logger).log(`API listening on http://${env.HOST}:${env.PORT}/api/v1`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
