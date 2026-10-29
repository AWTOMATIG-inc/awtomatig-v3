import { z } from "zod";

const flag = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  TRUST_PROXY: flag,
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\/.+/, "must be a postgres:// URL"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
  // Signs sessions. Rotating it signs everyone out.
  BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
  // The public origin of the admin app (the browser talks to it, and /api is rewritten to this API). Used for cookies and origin checks.
  BETTER_AUTH_URL: z.url(),
  // Shared with the website's server. Only a request that sends it may add a lead (POST /api/v1/crm/leads).
  LEAD_INGEST_KEY: z.string().min(32, "must be at least 32 characters"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

/** Validates the environment once at boot. Throws a readable error listing every bad value. */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    throw new Error(`Invalid environment:\n${lines.join("\n")}`);
  }
  return result.data;
}
