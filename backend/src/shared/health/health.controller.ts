import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import { sql } from "drizzle-orm";
import { createZodDto, ZodSerializerDto } from "nestjs-zod";
import { z } from "zod";

import { Public } from "../auth/auth.decorators";
import { Database } from "../db/database";
import { UnavailableError } from "../errors/app-error";

class HealthDto extends createZodDto(z.object({ status: z.literal("ok") })) {}

class HealthDetailsDto extends createZodDto(
  z.object({
    status: z.literal("ok"),
    database: z.literal("up"),
    uptimeSeconds: z.number().int().nonnegative(),
    timestamp: z.iso.datetime(),
  }),
) {}

// Public on purpose: monitors and deploys poll these, and they reveal nothing beyond up/down.
@Public()
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly database: Database) {}

  /** Throws a 503 in the standard error shape when PostgreSQL does not answer. */
  private async assertDatabase(): Promise<void> {
    try {
      await this.database.db.execute(sql`select 1`);
    } catch {
      throw new UnavailableError("The database is not reachable");
    }
  }

  /** A quick check by hand or from a dashboard: the API is up, PostgreSQL answers, and for how long it has been running. */
  @Get()
  @ZodSerializerDto(HealthDetailsDto)
  @ApiOkResponse({ type: HealthDetailsDto })
  @ApiServiceUnavailableResponse({ description: "PostgreSQL is not reachable" })
  async health() {
    await this.assertDatabase();
    return {
      status: "ok" as const,
      database: "up" as const,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /** The process is up. Used by PM2 or a process monitor; it never touches the database. */
  @Get("live")
  @ZodSerializerDto(HealthDto)
  @ApiOkResponse({ type: HealthDto })
  live() {
    return { status: "ok" as const };
  }

  /** The process can serve traffic: PostgreSQL answers. Used by deploys before switching traffic. */
  @Get("ready")
  @ZodSerializerDto(HealthDto)
  @ApiOkResponse({ type: HealthDto })
  @ApiServiceUnavailableResponse({ description: "PostgreSQL is not reachable" })
  async ready() {
    await this.assertDatabase();
    return { status: "ok" as const };
  }
}
