import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";

import type { CaseStudy } from "./case-studies";
import type { Testimonial } from "./testimonials";

/** The same limits as the backend (it checks the file's real bytes); these only give feedback before the upload starts. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";
export const ALT_MAX_LENGTH = 200;

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** A message when the chosen file cannot be used, otherwise null. */
export function imageFileProblem(file: File): string | null {
  if (!IMAGE_TYPES.has(file.type)) return "Use a PNG, JPEG or WebP image.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_IMAGE_BYTES) return "The image must be 5 MB or smaller.";
  return null;
}

/** A message when the alt text cannot be used, otherwise null. */
export function altProblem(alt: string): string | null {
  const text = alt.trim();
  if (text.length === 0) return "Describe the image for people who cannot see it.";
  if (text.length > ALT_MAX_LENGTH) return `Use ${ALT_MAX_LENGTH} characters or fewer.`;
  return null;
}

export type UploadFailure = { ok: false; status: number; message: string };
export type UploadResult = { ok: true; study: CaseStudy } | UploadFailure;
export type LogoUploadResult = { ok: true; testimonial: Testimonial } | UploadFailure;

/** What a failed upload says. The backend's own message is used when it sent one (they are written for people). */
function failure(response: Response, error: unknown, fallback: string): UploadFailure {
  return {
    ok: false,
    status: response.status,
    message:
      response.status === 403
        ? "You do not have permission to do this."
        : response.status === 413
          ? "The image must be 5 MB or smaller."
          : apiMessage(error, fallback),
  };
}

const UNREACHABLE: UploadFailure = {
  ok: false,
  status: 0,
  message: "Cannot reach the server. Check your connection and try again.",
};

/**
 * Uploads (or replaces) a case study's showcase image. The one place that builds the multipart request: the typed client sends
 * the form, and the browser sets the boundary itself. The backend finds the real file type from the bytes and checks the rest.
 */
export async function uploadCaseStudyImage(id: string, file: File, alt: string): Promise<UploadResult> {
  try {
    const { data, response, error } = await api.PUT("/api/v1/cms/case-studies/{id}/image", {
      params: { path: { id } },
      // The generated type calls the file a string; the serializer below sends the real File.
      body: { alt: alt.trim(), image: "" },
      bodySerializer: () => {
        const form = new FormData();
        form.append("alt", alt.trim());
        form.append("image", file);
        return form;
      },
    });
    if (data) return { ok: true, study: data };
    return failure(response, error, "The image could not be uploaded. Try again.");
  } catch {
    return UNREACHABLE;
  }
}

/** Uploads (or replaces) a testimonial's company logo: one `logo` file and nothing else, since the company name is its alt text. */
export async function uploadTestimonialLogo(id: string, file: File): Promise<LogoUploadResult> {
  try {
    const { data, response, error } = await api.PUT("/api/v1/cms/testimonials/{id}/logo", {
      params: { path: { id } },
      body: { logo: "" },
      bodySerializer: () => {
        const form = new FormData();
        form.append("logo", file);
        return form;
      },
    });
    if (data) return { ok: true, testimonial: data };
    return failure(response, error, "The logo could not be uploaded. Try again.");
  } catch {
    return UNREACHABLE;
  }
}
