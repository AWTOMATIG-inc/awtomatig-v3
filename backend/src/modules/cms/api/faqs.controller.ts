import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ZodSerializerDto } from "nestjs-zod";

import { type AuthContext, CurrentAuth, Public, RequirePermission } from "../../../shared/auth/auth.decorators";
import { FaqsService } from "../service/faqs.service";
import {
  CreateFaqDto,
  FaqDto,
  FaqIdParamsDto,
  FaqListDto,
  ListFaqsQueryDto,
  PublicFaqListDto,
  ReorderFaqsDto,
  UpdateFaqDto,
} from "./faqs.dto";

@ApiTags("cms")
@Controller("cms/faqs")
export class FaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  @RequirePermission("cms.faq.read")
  @ZodSerializerDto(FaqListDto)
  @ApiOkResponse({ type: FaqListDto })
  list(@Query() query: ListFaqsQueryDto) {
    return this.faqs.list(query);
  }

  @Post()
  @RequirePermission("cms.faq.create")
  @HttpCode(201)
  @ZodSerializerDto(FaqDto)
  @ApiCreatedResponse({ type: FaqDto })
  create(@Body() body: CreateFaqDto, @CurrentAuth() auth: AuthContext) {
    return this.faqs.create(body, auth.userId);
  }

  // Declared before `:id` routes so "order" is never read as an id.
  @Put("order")
  @RequirePermission("cms.faq.update")
  @ZodSerializerDto(FaqListDto)
  @ApiOkResponse({ type: FaqListDto, description: "The list in its new order" })
  setOrder(@Body() body: ReorderFaqsDto, @CurrentAuth() auth: AuthContext) {
    return this.faqs.setOrder(body, auth.userId);
  }

  @Get(":id")
  @RequirePermission("cms.faq.read")
  @ZodSerializerDto(FaqDto)
  @ApiOkResponse({ type: FaqDto })
  @ApiNotFoundResponse({ description: "No such FAQ" })
  get(@Param() params: FaqIdParamsDto) {
    return this.faqs.get(params.id);
  }

  @Patch(":id")
  @RequirePermission("cms.faq.update")
  @ZodSerializerDto(FaqDto)
  @ApiOkResponse({ type: FaqDto })
  @ApiNotFoundResponse({ description: "No such FAQ" })
  update(@Param() params: FaqIdParamsDto, @Body() body: UpdateFaqDto, @CurrentAuth() auth: AuthContext) {
    return this.faqs.update(params.id, body, auth.userId);
  }

  @Post(":id/publish")
  @RequirePermission("cms.faq.update")
  @HttpCode(200)
  @ZodSerializerDto(FaqDto)
  @ApiOkResponse({ type: FaqDto })
  @ApiNotFoundResponse({ description: "No such FAQ" })
  @ApiConflictResponse({ description: "The FAQ is not a draft, or the website's list of 100 is full" })
  publish(@Param() params: FaqIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.faqs.publish(params.id, auth.userId);
  }

  @Post(":id/unpublish")
  @RequirePermission("cms.faq.update")
  @HttpCode(200)
  @ZodSerializerDto(FaqDto)
  @ApiOkResponse({ type: FaqDto })
  @ApiNotFoundResponse({ description: "No such FAQ" })
  @ApiConflictResponse({ description: "The FAQ is not published" })
  unpublish(@Param() params: FaqIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.faqs.unpublish(params.id, auth.userId);
  }

  /** Deletes the FAQ in any state; a published one disappears from the website. */
  @Delete(":id")
  @RequirePermission("cms.faq.delete")
  @HttpCode(204)
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiNotFoundResponse({ description: "No such FAQ" })
  async remove(@Param() params: FaqIdParamsDto, @CurrentAuth() auth: AuthContext): Promise<void> {
    await this.faqs.remove(params.id, auth.userId);
  }
}

/** What the website reads, server to server. Public because published content is public anyway; drafts never appear. */
@ApiTags("cms")
@Controller("cms/public/faqs")
export class PublicFaqsController {
  constructor(private readonly faqs: FaqsService) {}

  @Get()
  @Public()
  @ZodSerializerDto(PublicFaqListDto)
  @ApiOkResponse({ type: PublicFaqListDto, description: "Published FAQs in display order, at most 100" })
  list() {
    return this.faqs.listPublic();
  }
}
