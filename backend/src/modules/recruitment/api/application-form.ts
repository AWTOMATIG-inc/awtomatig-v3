import type { FastifyRequest } from "fastify";

import { ValidationError } from "../../../shared/errors/app-error";
import { MAX_RESUME_BYTES, type ResumeFile } from "../domain/application";

export interface ApplicationForm {
  /** The parsed JSON from the `payload` field, not yet validated. */
  payload: unknown;
  resume: ResumeFile | null;
}

// Codes @fastify/multipart raises when a limit set in bootstrap.ts is hit, mapped to a message the website can show.
const LIMIT_MESSAGES: Record<string, string> = {
  FST_REQ_FILE_TOO_LARGE: `The resume must be ${MAX_RESUME_BYTES / (1024 * 1024)} MB or smaller`,
  FST_FILES_LIMIT: "Send exactly one resume file",
  FST_FIELDS_LIMIT: "The form has too many fields",
  FST_PARTS_LIMIT: "The form has too many parts",
};

/**
 * Reads the website's `multipart/form-data` request: a `payload` field with the JSON and one `resume` file. The file size is
 * capped while it streams, so an oversized upload is never held in memory. HTTP only: validating the content is the service's job.
 */
export async function readApplicationForm(request: FastifyRequest): Promise<ApplicationForm> {
  if (!request.isMultipart()) throw new ValidationError("Send the application as multipart/form-data");

  let payloadText: string | null = null;
  let resume: ResumeFile | null = null;
  try {
    for await (const part of request.parts()) {
      if (part.type === "file") {
        const buffer = await part.toBuffer();
        if (part.fieldname !== "resume") throw new ValidationError("Only a `resume` file is accepted");
        if (resume) throw new ValidationError("Send exactly one resume file");
        resume = { filename: part.filename, mimetype: part.mimetype, buffer };
      } else if (part.fieldname === "payload" && typeof part.value === "string") {
        payloadText = part.value;
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    const code = (error as { code?: unknown }).code;
    const message = typeof code === "string" ? LIMIT_MESSAGES[code] : undefined;
    if (message) throw new ValidationError(message, { resume: message });
    throw error;
  }

  if (payloadText === null) throw new ValidationError("The form is missing its `payload` field");
  try {
    return { payload: JSON.parse(payloadText) as unknown, resume };
  } catch {
    throw new ValidationError("The `payload` field is not valid JSON");
  }
}
