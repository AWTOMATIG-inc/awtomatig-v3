import type { FastifyRequest } from "fastify";

import { ValidationError } from "../../../shared/errors/app-error";
import { MAX_DOCUMENT_BYTES } from "../domain/document";
import { type UploadedDocument } from "../service/documents.service";

export interface DocumentForm {
  /** The text fields, not yet validated. */
  fields: Record<string, string>;
  file: UploadedDocument | null;
}

// Codes @fastify/multipart raises when a limit set in bootstrap.ts is hit, mapped to a message the admin can show.
const LIMIT_MESSAGES: Record<string, string> = {
  FST_REQ_FILE_TOO_LARGE: `The file must be ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MB or smaller`,
  FST_FILES_LIMIT: "Send exactly one file",
  FST_FIELDS_LIMIT: "The form has too many fields",
  FST_PARTS_LIMIT: "The form has too many parts",
};

const TEXT_FIELDS = ["docType", "title", "expiresOn", "note"];

/**
 * Reads the admin's `multipart/form-data` request: one `file` plus the text fields `docType`, `title`, `expiresOn` and `note`. The
 * size is capped while the file streams, so an oversized upload is never held in memory. HTTP only: checking the file's content
 * is the service's job.
 */
export async function readDocumentForm(request: FastifyRequest): Promise<DocumentForm> {
  if (!request.isMultipart()) throw new ValidationError("Send the document as multipart/form-data");

  const fields: Record<string, string> = {};
  let file: UploadedDocument | null = null;
  try {
    for await (const part of request.parts()) {
      if (part.type === "file") {
        const buffer = await part.toBuffer();
        if (part.fieldname !== "file") throw new ValidationError("Only a `file` upload is accepted");
        if (file) throw new ValidationError("Send exactly one file");
        file = { filename: part.filename, buffer };
      } else if (TEXT_FIELDS.includes(part.fieldname) && typeof part.value === "string") {
        // An empty date field means "no expiry".
        if (!(part.fieldname === "expiresOn" && part.value === "")) fields[part.fieldname] = part.value;
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    const code = (error as { code?: unknown }).code;
    const message = typeof code === "string" ? LIMIT_MESSAGES[code] : undefined;
    if (message) throw new ValidationError(message, { file: message });
    throw error;
  }
  return { fields, file };
}
