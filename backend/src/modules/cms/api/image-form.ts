import type { FastifyRequest } from "fastify";

import { ValidationError } from "../../../shared/errors/app-error";
import { MAX_IMAGE_BYTES } from "../domain/image";
import type { ImageUpload } from "../service/case-studies.service";

// Codes @fastify/multipart raises when a limit set in bootstrap.ts is hit, mapped to a message the admin can show.
const LIMIT_MESSAGES: Record<string, string> = {
  FST_REQ_FILE_TOO_LARGE: `The image must be ${MAX_IMAGE_BYTES / (1024 * 1024)} MB or smaller`,
  FST_FILES_LIMIT: "Send exactly one image file",
  FST_FIELDS_LIMIT: "The form has too many fields",
  FST_PARTS_LIMIT: "The form has too many parts",
};

/**
 * Reads the admin's `multipart/form-data` request: an `alt` text field and one `image` file. The size is capped while the file
 * streams, so an oversized upload is never held in memory. HTTP only: checking that it really is an image is the service's job.
 */
export async function readImageForm(request: FastifyRequest): Promise<ImageUpload> {
  if (!request.isMultipart()) throw new ValidationError("Send the image as multipart/form-data");

  let alt: string | null = null;
  let buffer: Buffer | null = null;
  try {
    for await (const part of request.parts()) {
      if (part.type === "file") {
        const bytes = await part.toBuffer();
        if (part.fieldname !== "image") throw new ValidationError("Only an `image` file is accepted");
        if (buffer) throw new ValidationError("Send exactly one image file");
        buffer = bytes;
      } else if (part.fieldname === "alt" && typeof part.value === "string") {
        alt = part.value;
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    const code = (error as { code?: unknown }).code;
    const message = typeof code === "string" ? LIMIT_MESSAGES[code] : undefined;
    if (message) throw new ValidationError(message, { image: message });
    throw error;
  }

  if (buffer === null) throw new ValidationError("The form is missing its `image` file", { image: "Choose an image" });
  if (alt === null) throw new ValidationError("The form is missing its `alt` field", { alt: "Describe the image" });
  return { buffer, alt };
}
