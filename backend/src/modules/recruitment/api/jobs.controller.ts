import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ZodSerializerDto } from "nestjs-zod";

import { type AuthContext, CurrentAuth, RequirePermission } from "../../../shared/auth/auth.decorators";
import { JobsService } from "../service/jobs.service";
import { CreateJobDto, JobDto, JobIdParamsDto, JobListDto, ListJobsQueryDto, ReopenJobDto, UpdateJobDto } from "./jobs.dto";

@ApiTags("recruitment")
@Controller("recruitment/jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @RequirePermission("recruitment.job.read")
  @ZodSerializerDto(JobListDto)
  @ApiOkResponse({ type: JobListDto })
  list(@Query() query: ListJobsQueryDto) {
    return this.jobs.list(query);
  }

  @Post()
  @RequirePermission("recruitment.job.create")
  @HttpCode(201)
  @ZodSerializerDto(JobDto)
  @ApiCreatedResponse({ type: JobDto })
  create(@Body() body: CreateJobDto, @CurrentAuth() auth: AuthContext) {
    return this.jobs.create(body, auth.userId);
  }

  @Get(":id")
  @RequirePermission("recruitment.job.read")
  @ZodSerializerDto(JobDto)
  @ApiOkResponse({ type: JobDto })
  @ApiNotFoundResponse({ description: "No such job" })
  get(@Param() params: JobIdParamsDto) {
    return this.jobs.get(params.id);
  }

  @Patch(":id")
  @RequirePermission("recruitment.job.update")
  @ZodSerializerDto(JobDto)
  @ApiOkResponse({ type: JobDto })
  @ApiNotFoundResponse({ description: "No such job" })
  update(@Param() params: JobIdParamsDto, @Body() body: UpdateJobDto, @CurrentAuth() auth: AuthContext) {
    return this.jobs.update(params.id, body, auth.userId);
  }

  @Post(":id/publish")
  @RequirePermission("recruitment.job.update")
  @HttpCode(200)
  @ZodSerializerDto(JobDto)
  @ApiOkResponse({ type: JobDto })
  @ApiNotFoundResponse({ description: "No such job" })
  @ApiConflictResponse({ description: "The job is not a draft" })
  publish(@Param() params: JobIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.jobs.publish(params.id, auth.userId);
  }

  @Post(":id/close")
  @RequirePermission("recruitment.job.update")
  @HttpCode(200)
  @ZodSerializerDto(JobDto)
  @ApiOkResponse({ type: JobDto })
  @ApiNotFoundResponse({ description: "No such job" })
  @ApiConflictResponse({ description: "The job is not open" })
  close(@Param() params: JobIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.jobs.close(params.id, auth.userId);
  }

  @Post(":id/reopen")
  @RequirePermission("recruitment.job.update")
  @HttpCode(200)
  @ZodSerializerDto(JobDto)
  @ApiOkResponse({ type: JobDto })
  @ApiNotFoundResponse({ description: "No such job" })
  @ApiConflictResponse({ description: "The job is not closed" })
  reopen(@Param() params: JobIdParamsDto, @Body() body: ReopenJobDto, @CurrentAuth() auth: AuthContext) {
    return this.jobs.reopen(params.id, body, auth.userId);
  }
}
