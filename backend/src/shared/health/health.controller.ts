import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from "@nestjs/swagger";
import { sql } from "drizzle-orm";
import { createZodDto, ZodSerializerDto } from "nestjs-zod";
import { z } from "zod";

import { Database } from "../db/database";
import { UnavailableError } from "../errors/app-error";

class HealthDto extends createZodDto(z.object({ status: z.literal("ok") })) {}

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly database: Database) {}

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
    try {
      await this.database.db.execute(sql`select 1`);
    } catch {
      throw new UnavailableError("The database is not reachable");
    }
    return { status: "ok" as const };
  }
}
