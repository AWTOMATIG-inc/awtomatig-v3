import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ZodSerializerDto } from "nestjs-zod";

import { type AuthContext, CurrentAuth, Public, RequirePermission } from "../../../shared/auth/auth.decorators";
import { LeadsService } from "../service/leads.service";
import {
  CapturedLeadDto,
  CaptureLeadDto,
  LeadDto,
  LeadIdParamsDto,
  LeadListDto,
  LeadStatsDto,
  LeadStatsQueryDto,
  ListLeadsQueryDto,
  UpdateLeadDto,
} from "./leads.dto";
import { LeadIngestGuard } from "./lead-ingest.guard";

@ApiTags("crm")
@Controller("crm/leads")
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  /**
   * Public on purpose, but only for the website's server: it must send the shared `x-ingest-key`. Safe to retry with the same
   * `submissionId`.
   */
  @Post()
  @Public()
  @UseGuards(LeadIngestGuard)
  @HttpCode(201)
  @ZodSerializerDto(CapturedLeadDto)
  @ApiHeader({ name: "x-ingest-key", required: true, description: "The shared LEAD_INGEST_KEY" })
  @ApiCreatedResponse({ type: CapturedLeadDto })
  @ApiUnauthorizedResponse({ description: "Missing or wrong ingest key" })
  capture(@Body() body: CaptureLeadDto) {
    return this.leads.capture(body);
  }

  @Get()
  @RequirePermission("crm.lead.read")
  @ZodSerializerDto(LeadListDto)
  @ApiOkResponse({ type: LeadListDto })
  list(@Query() query: ListLeadsQueryDto) {
    return this.leads.list(query);
  }

  // Declared before `:id` so "stats" is not read as an id.
  @Get("stats")
  @RequirePermission("crm.lead.read")
  @ZodSerializerDto(LeadStatsDto)
  @ApiOkResponse({ type: LeadStatsDto })
  stats(@Query() query: LeadStatsQueryDto) {
    return this.leads.stats(query);
  }

  @Get(":id")
  @RequirePermission("crm.lead.read")
  @ZodSerializerDto(LeadDto)
  @ApiOkResponse({ type: LeadDto })
  @ApiNotFoundResponse({ description: "No such lead" })
  get(@Param() params: LeadIdParamsDto) {
    return this.leads.get(params.id);
  }

  @Patch(":id")
  @RequirePermission("crm.lead.update")
  @ZodSerializerDto(LeadDto)
  @ApiOkResponse({ type: LeadDto })
  @ApiNotFoundResponse({ description: "No such lead" })
  update(@Param() params: LeadIdParamsDto, @Body() body: UpdateLeadDto, @CurrentAuth() auth: AuthContext) {
    return this.leads.update(params.id, body, auth.userId);
  }
}
