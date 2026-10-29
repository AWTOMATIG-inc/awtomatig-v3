import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";

import { AppConfig } from "../config/app-config";

// Monitors poll these every few seconds; logging each success would bury everything else. Failures are still logged.
const QUIET_PATHS = ["/health/live", "/health/ready"];

// Nest narrates its own startup (modules initialised, routes mapped). Useful once, noise every restart in watch mode.
const QUIET_CONTEXTS = new Set(["NestFactory", "InstanceLoader", "RoutesResolver", "RouterExplorer", "NestApplication"]);

/**
 * One short line per request. Development reads `GET /api/v1/health 200 8ms`; production writes the same message plus a few
 * JSON fields (request id, method, url, status, duration) that a log search can filter on. Headers, cookies and bodies are
 * never logged, so there is nothing to redact beyond what the serializers keep. The request id itself is set in bootstrap.ts.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.env.LOG_LEVEL,
          transport:
            config.env.NODE_ENV === "development"
              ? {
                  target: "pino-pretty",
                  options: {
                    singleLine: true,
                    ignore: "pid,hostname,context,req,res,responseTime",
                    messageFormat: "{if context}[{context}] {end}{msg}",
                  },
                }
              : undefined,
          hooks: {
            logMethod(args: unknown[], method: (...args: unknown[]) => void) {
              const first = args[0] as { context?: string } | undefined;
              if (typeof first === "object" && first?.context && QUIET_CONTEXTS.has(first.context)) return;
              method.apply(this, args);
            },
          },
          serializers: {
            req: (req: { id?: string; method?: string; url?: string }) => ({ id: req.id, method: req.method, url: req.url }),
            res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
          },
          customLogLevel: (req, res, error) => {
            if (error || res.statusCode >= 500) return "error";
            if (res.statusCode >= 400) return "warn";
            if (QUIET_PATHS.some((path) => req.url?.includes(path))) return "silent";
            return "info";
          },
          customSuccessMessage: (req, res, responseTime) =>
            `${req.method} ${req.url} ${res.statusCode} ${Math.round(responseTime)}ms`,
          customErrorMessage: (req, res, error) => `${req.method} ${req.url} ${res.statusCode} ${error.message}`,
        },
      }),
    }),
  ],
})
export class LoggingModule {}
