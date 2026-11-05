import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ZodSerializerDto } from "nestjs-zod";

import { type AuthContext, CurrentAuth, Public, RequirePermission } from "../../../shared/auth/auth.decorators";
import { SiteMetricsService } from "../service/site-metrics.service";
import {
  PublicSiteMetricsDto,
  SiteMetricDto,
  SiteMetricKeyParamsDto,
  SiteMetricListDto,
  UpdateSiteMetricDto,
} from "./site-metrics.dto";

@ApiTags("cms")
@Controller("cms/site-metrics")
export class SiteMetricsController {
  constructor(private readonly metrics: SiteMetricsService) {}

  /** Every trust number with its title and the pages where it appears. */
  @Get()
  @RequirePermission("cms.metric.read")
  @ZodSerializerDto(SiteMetricListDto)
  @ApiOkResponse({ type: SiteMetricListDto })
  list() {
    return this.metrics.list();
  }

  @Patch(":key")
  @RequirePermission("cms.metric.update")
  @ZodSerializerDto(SiteMetricDto)
  @ApiOkResponse({ type: SiteMetricDto, description: "The figure with its new value; it is live on the website at once" })
  @ApiNotFoundResponse({ description: "No such figure" })
  update(@Param() params: SiteMetricKeyParamsDto, @Body() body: UpdateSiteMetricDto, @CurrentAuth() auth: AuthContext) {
    return this.metrics.update(params.key, body, auth.userId);
  }
}

/** What the website reads, server to server. Public because these figures are on the public site anyway. */
@ApiTags("cms")
@Controller("cms/public/site-metrics")
export class PublicSiteMetricsController {
  constructor(private readonly metrics: SiteMetricsService) {}

  @Get()
  @Public()
  @ZodSerializerDto(PublicSiteMetricsDto)
  @ApiOkResponse({ type: PublicSiteMetricsDto, description: "Every figure's current value, keyed by its key" })
  async list() {
    return { values: await this.metrics.listPublic() };
  }
}
