import { randomUUID } from "node:crypto";

import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { HttpException, HttpStatus } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";
import { parseEnv } from "./shared/config/env";
import { setupOpenApiUi } from "./shared/openapi/setup";

export const API_PREFIX = "api/v1";

/** Builds the configured Fastify application. Shared by the server, the OpenAPI export and the tests. */
export async function createApp(): Promise<NestFastifyApplication> {
  const env = parseEnv(process.env);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: env.TRUST_PROXY,
      bodyLimit: 1_048_576,
      requestIdHeader: "x-request-id",
      genReqId: () => randomUUID(),
    }),
    { bufferLogs: true },
  );
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();
  // Echo the request id (also the one in the logs) so a caller can quote it when reporting a problem.
  app
    .getHttpAdapter()
    .getInstance()
    .addHook("onRequest", (request, reply, done) => {
      void reply.header("x-request-id", request.id);
      done();
    });

  const production = env.NODE_ENV === "production";
  // The interactive docs need inline scripts, so the CSP is relaxed outside production only.
  await app.register(helmet, { contentSecurityPolicy: production ? undefined : false });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: "1 minute",
    errorResponseBuilder: (_request, context) =>
      new HttpException(`Too many requests. Try again in ${context.after}.`, HttpStatus.TOO_MANY_REQUESTS),
  });
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });

  // Development only. (@fastify/static is ESM-only, which Jest cannot load, so tests run without the UI.)
  if (env.NODE_ENV === "development") setupOpenApiUi(app);
  return app;
}
