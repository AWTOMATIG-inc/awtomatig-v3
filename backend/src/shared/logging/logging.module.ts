import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";

import { AppConfig } from "../config/app-config";

/** Structured JSON logs (the request id is set in bootstrap.ts). Secrets and cookies are redacted; log ids, not content. */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.env.LOG_LEVEL,
          transport: config.env.NODE_ENV === "development" ? { target: "pino-pretty", options: { singleLine: true } } : undefined,
          redact: {
            paths: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
            censor: "[redacted]",
          },
        },
      }),
    }),
  ],
})
export class LoggingModule {}
