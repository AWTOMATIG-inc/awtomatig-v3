import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req } from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { ZodSerializerDto } from "nestjs-zod";

import { type AuthContext, CurrentAuth, RequirePermission } from "../../../shared/auth/auth.decorators";
import { DocumentsService } from "../service/documents.service";
import { readDocumentForm } from "./document-form";
import {
  DocumentDto,
  DocumentEmployeeParamsDto,
  DocumentLinkDto,
  DocumentListDto,
  DocumentParamsDto,
  UpdateDocumentDto,
} from "./documents.dto";

@ApiTags("hr")
@Controller("hr/employees/:id/documents")
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @RequirePermission("hr.document.read")
  @ZodSerializerDto(DocumentListDto)
  @ApiOkResponse({ type: DocumentListDto, description: "The employee's documents, oldest first. No links: ask for one per file" })
  @ApiNotFoundResponse({ description: "No such employee" })
  list(@Param() params: DocumentEmployeeParamsDto) {
    return this.documents.list(params.id);
  }

  /**
   * Adds one document row with its file. Send `multipart/form-data` with a `file` (PDF, JPEG, PNG or WebP, 5 MB at most) and the
   * text fields `docType`, `title` (required for `other`), `expiresOn` (optional) and `note` (optional). The type is read from the
   * file itself, never from its name.
   */
  @Post()
  @RequirePermission("hr.document.manage")
  @HttpCode(201)
  @ZodSerializerDto(DocumentDto)
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["docType", "file"],
      properties: {
        docType: { type: "string", enum: ["nid", "passport", "contract", "certificate", "cv", "other"] },
        title: { type: "string", description: "Required when docType is other" },
        expiresOn: { type: "string", format: "date" },
        note: { type: "string" },
        file: { type: "string", format: "binary", description: "A PDF, JPEG, PNG or WebP file, 5 MB at most" },
      },
    },
  })
  @ApiCreatedResponse({ type: DocumentDto })
  @ApiNotFoundResponse({ description: "No such employee" })
  @ApiConflictResponse({ description: "The employee already has the maximum number of documents" })
  async add(@Param() params: DocumentEmployeeParamsDto, @Req() request: FastifyRequest, @CurrentAuth() auth: AuthContext) {
    const form = await readDocumentForm(request);
    return this.documents.add(params.id, form.fields, form.file, auth.userId);
  }

  /** A signed link to the file, valid for five minutes. Each request is recorded in the audit log. */
  @Get(":docId/link")
  @RequirePermission("hr.document.read")
  @ZodSerializerDto(DocumentLinkDto)
  @ApiOkResponse({ type: DocumentLinkDto })
  @ApiNotFoundResponse({ description: "No such document, or its file is missing" })
  link(@Param() params: DocumentParamsDto, @CurrentAuth() auth: AuthContext) {
    return this.documents.link(params.id, params.docId, auth.userId);
  }

  @Patch(":docId")
  @RequirePermission("hr.document.manage")
  @ZodSerializerDto(DocumentDto)
  @ApiOkResponse({ type: DocumentDto })
  @ApiNotFoundResponse({ description: "No such document" })
  update(@Param() params: DocumentParamsDto, @Body() body: UpdateDocumentDto, @CurrentAuth() auth: AuthContext) {
    return this.documents.update(params.id, params.docId, body, auth.userId);
  }

  @Delete(":docId")
  @RequirePermission("hr.document.manage")
  @HttpCode(204)
  @ApiNoContentResponse({ description: "Removed, with its file" })
  @ApiNotFoundResponse({ description: "No such document" })
  async remove(@Param() params: DocumentParamsDto, @CurrentAuth() auth: AuthContext): Promise<void> {
    await this.documents.remove(params.id, params.docId, auth.userId);
  }
}
