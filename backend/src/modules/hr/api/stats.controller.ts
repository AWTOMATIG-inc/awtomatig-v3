import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { createZodDto, ZodSerializerDto } from "nestjs-zod";
import { z } from "zod";

import { RequirePermission } from "../../../shared/auth/auth.decorators";
import { DOCUMENT_TYPES } from "../domain/document";
import { HrStatsService } from "../service/stats.service";

export class HrStatsDto extends createZodDto(
  z.object({
    /** People working now (including those on notice). */
    headcount: z.number().int(),
    joinedThisMonth: z.number().int(),
    leftThisMonth: z.number().int(),
    expiringSoonDays: z.number().int(),
    /** Documents expiring within `expiringSoonDays` days, plus the ones already expired. */
    expiringDocuments: z.number().int(),
    /** Of those, how many have already expired. */
    expiredDocuments: z.number().int(),
    /** The earliest-expiring ones, up to six. Names the person and the kind of document, never a file. */
    expiring: z.array(
      z.object({
        id: z.uuid(),
        employeeId: z.uuid(),
        employeeNo: z.number().int(),
        fullName: z.string(),
        docType: z.enum(DOCUMENT_TYPES),
        title: z.string(),
        expiresOn: z.iso.date(),
      }),
    ),
  }),
) {}

@ApiTags("hr")
@Controller("hr/stats")
export class HrStatsController {
  constructor(private readonly stats: HrStatsService) {}

  @Get()
  @RequirePermission("hr.employee.read")
  @ZodSerializerDto(HrStatsDto)
  @ApiOkResponse({ type: HrStatsDto })
  get() {
    return this.stats.stats();
  }
}
