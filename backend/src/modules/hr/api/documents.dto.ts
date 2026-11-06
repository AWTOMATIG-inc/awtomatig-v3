import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { DOCUMENT_TYPES, updateDocumentSchema } from "../domain/document";

const iso = z.iso.datetime();

// `.nullable()` on a response field comes out as an array type in openapi.json (a nestjs-zod quirk), so spell the union out.
const orNull = <T extends z.ZodType>(schema: T) => z.union([schema, z.null()]);

// A bare nullable string at the top of a DTO comes out as an array type in openapi.json, so a pattern that matches any text keeps it a plain string (the same trick the recruitment DTOs use for amounts).
const text = z.string().regex(/^[\s\S]*$/);

const document = z.object({
  id: z.uuid(),
  docType: z.enum(DOCUMENT_TYPES),
  /** What the row is called; empty when the type says enough. */
  title: z.string(),
  /** The name the file was uploaded with. */
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  /** `YYYY-MM-DD`, for documents that lapse. */
  expiresOn: orNull(z.iso.date()),
  note: z.string(),
  uploadedBy: orNull(text),
  createdAt: iso,
  updatedAt: iso,
});

export class DocumentDto extends createZodDto(document) {}
export class DocumentListDto extends createZodDto(z.object({ items: z.array(document) })) {}
export class DocumentLinkDto extends createZodDto(z.object({ url: z.url(), expiresAt: iso })) {}
export class UpdateDocumentDto extends createZodDto(updateDocumentSchema) {}
export class DocumentParamsDto extends createZodDto(z.object({ id: z.uuid(), docId: z.uuid() })) {}
export class DocumentEmployeeParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
