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
import { TestimonialsService } from "../service/testimonials.service";
import { readLogoForm } from "./image-form";
import {
  PublicTestimonialListDto,
  CreateTestimonialDto,
  ListTestimonialsQueryDto,
  ReorderTestimonialsDto,
  TestimonialDto,
  TestimonialIdParamsDto,
  TestimonialListDto,
  UpdateTestimonialDto,
} from "./testimonials.dto";

@ApiTags("cms")
@Controller("cms/testimonials")
export class TestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  @RequirePermission("cms.testimonial.read")
  @ZodSerializerDto(TestimonialListDto)
  @ApiOkResponse({ type: TestimonialListDto })
  list(@Query() query: ListTestimonialsQueryDto) {
    return this.testimonials.list(query);
  }

  @Post()
  @RequirePermission("cms.testimonial.create")
  @HttpCode(201)
  @ZodSerializerDto(TestimonialDto)
  @ApiCreatedResponse({ type: TestimonialDto })
  create(@Body() body: CreateTestimonialDto, @CurrentAuth() auth: AuthContext) {
    return this.testimonials.create(body, auth.userId);
  }

  // Declared before `:id` routes so "order" is never read as an id.
  @Put("order")
  @RequirePermission("cms.testimonial.update")
  @ZodSerializerDto(TestimonialListDto)
  @ApiOkResponse({ type: TestimonialListDto, description: "The list in its new order" })
  setOrder(@Body() body: ReorderTestimonialsDto, @CurrentAuth() auth: AuthContext) {
    return this.testimonials.setOrder(body, auth.userId);
  }

  @Get(":id")
  @RequirePermission("cms.testimonial.read")
  @ZodSerializerDto(TestimonialDto)
  @ApiOkResponse({ type: TestimonialDto })
  @ApiNotFoundResponse({ description: "No such testimonial" })
  get(@Param() params: TestimonialIdParamsDto) {
    return this.testimonials.get(params.id);
  }

  @Patch(":id")
  @RequirePermission("cms.testimonial.update")
  @ZodSerializerDto(TestimonialDto)
  @ApiOkResponse({ type: TestimonialDto })
  @ApiNotFoundResponse({ description: "No such testimonial" })
  @ApiConflictResponse({ description: "The client's agreement cannot be withdrawn while the testimonial is published" })
  update(@Param() params: TestimonialIdParamsDto, @Body() body: UpdateTestimonialDto, @CurrentAuth() auth: AuthContext) {
    return this.testimonials.update(params.id, body, auth.userId);
  }

  /** Uploads the company logo, or replaces it. Send `multipart/form-data` with one `logo` file (PNG, JPEG or WebP, 5 MB at most). */
  @Put(":id/logo")
  @RequirePermission("cms.testimonial.update")
  @ZodSerializerDto(TestimonialDto)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["logo"],
      properties: { logo: { type: "string", format: "binary", description: "A PNG, JPEG or WebP image, 5 MB at most" } },
    },
  })
  @ApiOkResponse({ type: TestimonialDto })
  @ApiNotFoundResponse({ description: "No such testimonial" })
  async setLogo(@Param() params: TestimonialIdParamsDto, @Req() request: FastifyRequest, @CurrentAuth() auth: AuthContext) {
    return this.testimonials.setLogo(params.id, { buffer: await readLogoForm(request) }, auth.userId);
  }

  /** Removes the logo; the card then shows the company name. Allowed while published. */
  @Delete(":id/logo")
  @RequirePermission("cms.testimonial.update")
  @ZodSerializerDto(TestimonialDto)
  @ApiOkResponse({ type: TestimonialDto })
  @ApiNotFoundResponse({ description: "No such testimonial" })
  removeLogo(@Param() params: TestimonialIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.testimonials.removeLogo(params.id, auth.userId);
  }

  @Post(":id/publish")
  @RequirePermission("cms.testimonial.update")
  @HttpCode(200)
  @ZodSerializerDto(TestimonialDto)
  @ApiOkResponse({ type: TestimonialDto })
  @ApiNotFoundResponse({ description: "No such testimonial" })
  @ApiConflictResponse({ description: "The testimonial is not a draft" })
  publish(@Param() params: TestimonialIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.testimonials.publish(params.id, auth.userId);
  }

  @Post(":id/unpublish")
  @RequirePermission("cms.testimonial.update")
  @HttpCode(200)
  @ZodSerializerDto(TestimonialDto)
  @ApiOkResponse({ type: TestimonialDto })
  @ApiNotFoundResponse({ description: "No such testimonial" })
  @ApiConflictResponse({ description: "The testimonial is not published" })
  unpublish(@Param() params: TestimonialIdParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.testimonials.unpublish(params.id, auth.userId);
  }

  @Delete(":id")
  @RequirePermission("cms.testimonial.delete")
  @HttpCode(204)
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiNotFoundResponse({ description: "No such testimonial" })
  @ApiConflictResponse({ description: "The testimonial is published; unpublish it first" })
  async remove(@Param() params: TestimonialIdParamsDto, @CurrentAuth() auth: AuthContext): Promise<void> {
    await this.testimonials.remove(params.id, auth.userId);
  }
}

/** What the website reads, server to server. Public because published content is public anyway; drafts never appear. */
@ApiTags("cms")
@Controller("cms/public/testimonials")
export class PublicTestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  @Public()
  @ZodSerializerDto(PublicTestimonialListDto)
  @ApiOkResponse({ type: PublicTestimonialListDto, description: "Published testimonials in display order, at most 50" })
  list() {
    return this.testimonials.listPublic();
  }
}
