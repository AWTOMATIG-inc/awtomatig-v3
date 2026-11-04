import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ZodSerializerDto } from "nestjs-zod";

import { type AuthContext, CurrentAuth, Public, RequirePermission } from "../../../shared/auth/auth.decorators";
import { CaseStudiesService } from "../service/case-studies.service";
import { readImageForm } from "./image-form";
import {
  CaseStudyDto,
  CaseStudyIdParamsDto,
  CaseStudyListDto,
  CreateCaseStudyDto,
  ListCaseStudiesQueryDto,
  PublicCaseStudyDto,
  PublicCaseStudyListDto,
  ReorderCaseStudiesDto,
  CaseStudySlugParamsDto,
  UpdateCaseStudyDto,
} from "./case-studies.dto";

@ApiTags("cms")
@Controller("cms/case-studies")
export class CaseStudiesController {
  constructor(private readonly caseStudies: CaseStudiesService) {}

  @Get()
  @RequirePermission("cms.case_study.read")
  @ZodSerializerDto(CaseStudyListDto)
  @ApiOkResponse({ type: CaseStudyListDto })
  list(@Query() query: ListCaseStudiesQueryDto) {
    return this.caseStudies.list(query);
  }

  @Post()
  @RequirePermission("cms.case_study.create")
  @HttpCode(201)
  @ZodSerializerDto(CaseStudyDto)
  @ApiCreatedResponse({ type: CaseStudyDto })
  @ApiConflictResponse({ description: "A case study with this address already exists" })
  create(@Body() body: CreateCaseStudyDto, @CurrentAuth() auth: AuthContext) {
    return this.caseStudies.create(body, auth.userId);
  }

  // Declared before `:id` routes so "order" is never read as an id.
  @Put("order")
  @RequirePermission("cms.case_study.update")
  @ZodSerializerDto(CaseStudyListDto)
  @ApiOkResponse({ type: CaseStudyListDto, description: "The list in its new order" })
  setOrder(@Body() body: ReorderCaseStudiesDto, @CurrentAuth() auth: AuthContext) {
    return this.caseStudies.setOrder(body, auth.userId);
  }

  @Get(":id")
  @RequirePermission("cms.case_study.read")
  @ZodSerializerDto(CaseStudyDto)
  @ApiOkResponse({ type: CaseStudyDto })
  @ApiNotFoundResponse({ description: "No such case study" })
  get(@Param() params: CaseStudyIdParamsDto) {
    return this.caseStudies.get(params.id);
  }

  @Patch(":id")
  @RequirePermission("cms.case_study.update")
  @ZodSerializerDto(CaseStudyDto)
  @ApiOkResponse({ type: CaseStudyDto })
  @ApiNotFoundResponse({ description: "No such case study" })
  update(@Param() params: CaseStudyIdParamsDto, @Body() body: UpdateCaseStudyDto, @CurrentAuth() auth: AuthContext) {
    return this.caseStudies.update(params.id, body, auth.userId);
  }

  /**
   * Uploads the showcase image, or replaces it. Send `multipart/form-data` with an `alt` field and one `image` file (PNG, JPEG or
   * WebP, 5 MB at most). The old file is deleted once the new one is saved.
   */
  @Put(":id/image")
  @RequirePermission("cms.case_study.update")
  @ZodSerializerDto(CaseStudyDto)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["alt", "image"],
      properties: {
        alt: { type: "string", description: "Describes the image for screen readers, 1 to 200 characters" },
        image: { type: "string", format: "binary", description: "A PNG, JPEG or WebP image, 5 MB at most" },
      },
    },
  })
  @ApiOkResponse({ type: CaseStudyDto })
  @ApiNotFoundResponse({ description: "No such case study" })
  async setImage(@Param() params: CaseStudyIdParamsDto, @Req() request: FastifyRequest, @CurrentAuth() auth: AuthContext) {
    return this.caseStudies.setImage(params.id, await readImageForm(request), auth.userId);
  }

  @Post(":id/publish")
  @RequirePermission("cms.case_study.update")
  @HttpCode(200)
  @ZodSerializerDto(CaseStudyDto)
  @ApiOkResponse({ type: CaseStudyDto })
  @ApiNotFoundResponse({ description: "No such case study" })
  @ApiConflictResponse({ description: "The case study is not a draft" })
  publish(@Param() params: CaseStudyIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.caseStudies.publish(params.id, auth.userId);
  }

  @Post(":id/unpublish")
  @RequirePermission("cms.case_study.update")
  @HttpCode(200)
  @ZodSerializerDto(CaseStudyDto)
  @ApiOkResponse({ type: CaseStudyDto })
  @ApiNotFoundResponse({ description: "No such case study" })
  @ApiConflictResponse({ description: "The case study is not published" })
  unpublish(@Param() params: CaseStudyIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.caseStudies.unpublish(params.id, auth.userId);
  }

  @Delete(":id")
  @RequirePermission("cms.case_study.delete")
  @HttpCode(204)
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiNotFoundResponse({ description: "No such case study" })
  @ApiConflictResponse({ description: "The case study is published; unpublish it first" })
  async remove(@Param() params: CaseStudyIdParamsDto, @CurrentAuth() auth: AuthContext): Promise<void> {
    await this.caseStudies.remove(params.id, auth.userId);
  }
}

/** What the website reads, server to server. Public because published content is public anyway; drafts never appear. */
@ApiTags("cms")
@Controller("cms/public/case-studies")
export class PublicCaseStudiesController {
  constructor(private readonly caseStudies: CaseStudiesService) {}

  @Get()
  @Public()
  @ZodSerializerDto(PublicCaseStudyListDto)
  @ApiOkResponse({ type: PublicCaseStudyListDto, description: "Published case studies in display order" })
  list() {
    return this.caseStudies.listPublic();
  }

  @Get(":slug")
  @Public()
  @ZodSerializerDto(PublicCaseStudyDto)
  @ApiOkResponse({ type: PublicCaseStudyDto })
  @ApiNotFoundResponse({ description: "No such case study, or it is not published" })
  get(@Param() params: CaseStudySlugParamsDto) {
    return this.caseStudies.getPublic(params.slug);
  }
}
