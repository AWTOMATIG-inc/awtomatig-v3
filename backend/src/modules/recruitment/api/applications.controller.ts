import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { ZodSerializerDto } from "nestjs-zod";

import { type AuthContext, CurrentAuth, Public, RequirePermission } from "../../../shared/auth/auth.decorators";
import { IngestKeyGuard } from "../../../shared/auth/ingest-key.guard";
import { ApplicationsService } from "../service/applications.service";
import { JobsService } from "../service/jobs.service";
import { readApplicationForm } from "./application-form";
import {
  ApplicationDto,
  ApplicationIdParamsDto,
  ApplicationListDto,
  JobApplicationsParamsDto,
  JobSlugParamsDto,
  ListApplicationsQueryDto,
  PublicJobDto,
  PublicJobListDto,
  RecruitmentStatsDto,
  ResumeLinkDto,
  SubmittedApplicationDto,
  UpdateApplicationDto,
} from "./applications.dto";

/** The careers page. Public on purpose, read only, and limited to what the website may show. */
@ApiTags("recruitment")
@Controller("recruitment/public/jobs")
export class PublicJobsController {
  constructor(
    private readonly jobs: JobsService,
    private readonly applications: ApplicationsService,
  ) {}

  @Get()
  @Public()
  @ZodSerializerDto(PublicJobListDto)
  @ApiOkResponse({ type: PublicJobListDto })
  list() {
    return this.jobs.listPublic();
  }

  @Get(":slug")
  @Public()
  @ZodSerializerDto(PublicJobDto)
  @ApiOkResponse({ type: PublicJobDto })
  @ApiNotFoundResponse({ description: "No such job, or it is still a draft" })
  get(@Param() params: JobSlugParamsDto) {
    return this.jobs.getPublic(params.slug);
  }

  /**
   * Public on purpose, but only for the website's server: it must send the shared `x-ingest-key`. Safe to retry with the same
   * `submissionId`. Send `multipart/form-data` with a JSON `payload` field and one PDF `resume` file (5 MB at most).
   */
  @Post(":slug/applications")
  @Public()
  @UseGuards(IngestKeyGuard)
  @HttpCode(201)
  @ZodSerializerDto(SubmittedApplicationDto)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["payload", "resume"],
      properties: {
        payload: {
          type: "string",
          description: "JSON: submissionId, fullName, email, phone, links, educations, experiences, answers, consent",
        },
        resume: { type: "string", format: "binary", description: "A PDF, 5 MB at most" },
      },
    },
  })
  @ApiHeader({ name: "x-ingest-key", required: true, description: "The shared LEAD_INGEST_KEY" })
  @ApiCreatedResponse({ type: SubmittedApplicationDto })
  @ApiUnauthorizedResponse({ description: "Missing or wrong ingest key" })
  @ApiNotFoundResponse({ description: "No such job, or it is still a draft" })
  @ApiConflictResponse({ description: "ALREADY_APPLIED, or NOT_ACCEPTING_APPLICATIONS" })
  async apply(@Param() params: JobSlugParamsDto, @Req() request: FastifyRequest) {
    const form = await readApplicationForm(request);
    return this.applications.submit(params.slug, form.payload, form.resume);
  }
}

/** Reviewing applications in the admin app. */
@ApiTags("recruitment")
@Controller("recruitment")
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  // Declared before the `:id` routes so "stats" can never be read as an id.
  @Get("stats")
  @RequirePermission("recruitment.application.read")
  @ZodSerializerDto(RecruitmentStatsDto)
  @ApiOkResponse({ type: RecruitmentStatsDto })
  stats() {
    return this.applications.stats();
  }

  @Get("jobs/:id/applications")
  @RequirePermission("recruitment.application.read")
  @ZodSerializerDto(ApplicationListDto)
  @ApiOkResponse({ type: ApplicationListDto })
  @ApiNotFoundResponse({ description: "No such job" })
  list(@Param() params: JobApplicationsParamsDto, @Query() query: ListApplicationsQueryDto) {
    return this.applications.listForJob(params.id, query);
  }

  @Get("applications/:id")
  @RequirePermission("recruitment.application.read")
  @ZodSerializerDto(ApplicationDto)
  @ApiOkResponse({ type: ApplicationDto })
  @ApiNotFoundResponse({ description: "No such application" })
  get(@Param() params: ApplicationIdParamsDto) {
    return this.applications.get(params.id);
  }

  @Patch("applications/:id")
  @RequirePermission("recruitment.application.update")
  @ZodSerializerDto(ApplicationDto)
  @ApiOkResponse({ type: ApplicationDto })
  @ApiNotFoundResponse({ description: "No such application" })
  update(@Param() params: ApplicationIdParamsDto, @Body() body: UpdateApplicationDto, @CurrentAuth() auth: AuthContext) {
    return this.applications.update(params.id, body, auth.userId);
  }

  /** A signed link to the resume, valid for five minutes. Each request is recorded in the audit log. */
  @Get("applications/:id/resume")
  @RequirePermission("recruitment.application.read")
  @ZodSerializerDto(ResumeLinkDto)
  @ApiOkResponse({ type: ResumeLinkDto })
  @ApiNotFoundResponse({ description: "No such application, or its file is missing" })
  resume(@Param() params: ApplicationIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.applications.resumeLink(params.id, auth.userId);
  }
}
