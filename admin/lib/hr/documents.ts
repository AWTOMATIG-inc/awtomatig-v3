import type { StatusTone } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";
import { formatPlainDate } from "@/lib/format";

import { todayInDhaka } from "./dates";

export type EmployeeDocument = components["schemas"]["DocumentDto"];
export type DocumentType = EmployeeDocument["docType"];

export const DOCUMENT_TYPES: readonly DocumentType[] = ["nid", "passport", "contract", "certificate", "cv", "other"];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  nid: "NID",
  passport: "Passport",
  contract: "Contract",
  certificate: "Certificate",
  cv: "CV",
  other: "Other",
};

/** The same limits as the backend (it checks the file's real bytes); these only give feedback before the upload starts. */
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";
const DOCUMENT_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

/** A message when the chosen file cannot be used, otherwise null. */
export function documentFileProblem(file: File): string | null {
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_DOCUMENT_BYTES) return "The file must be 5 MB or smaller.";
  // A file with no declared type is left to the backend, which reads the real type from the bytes.
  if (file.type && !DOCUMENT_MIME.has(file.type)) return "Use a PDF, JPEG, PNG or WebP file.";
  return null;
}

/** The name shown for a row: the title when there is one, otherwise the type. */
export function documentName(document: Pick<EmployeeDocument, "title" | "docType">): string {
  return document.title || DOCUMENT_TYPE_LABEL[document.docType];
}

/** How close a document is to lapsing. A lapsed or nearly lapsed one needs a decision, so it gets a dot (DESIGN.md section 7.4). */
export function expiryState(
  expiresOn: string | null,
  today: string = todayInDhaka(),
): { label: string; tone: StatusTone } | null {
  if (!expiresOn) return null;
  if (expiresOn < today) return { label: `Expired ${formatPlainDate(expiresOn)}`, tone: "error" };
  const soon = new Date(`${today}T00:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + 30);
  if (expiresOn <= soon.toISOString().slice(0, 10)) return { label: `Expires ${formatPlainDate(expiresOn)}`, tone: "caution" };
  return { label: `Expires ${formatPlainDate(expiresOn)}`, tone: "neutral" };
}

export type UploadResult = { ok: true } | { ok: false; status: number; message: string; fields: Record<string, string> };

/** What a failed request says. The backend's own message is used when it sent one (they are written for people). */
function failure(response: Response, error: unknown, fallback: string): Extract<UploadResult, { ok: false }> {
  const details = (error as { details?: unknown } | null)?.details;
  const fields: Record<string, string> = {};
  if (details && typeof details === "object" && !Array.isArray(details)) {
    for (const [key, value] of Object.entries(details)) if (typeof value === "string") fields[key] = value;
  }
  return {
    ok: false,
    status: response.status,
    message: response.status === 403 ? "You do not have permission to do this." : apiMessage(error, fallback),
    fields,
  };
}

/** Adds a document. The one place that builds the multipart request: the typed client sends the form and the browser sets the boundary. */
export async function uploadDocument(
  employeeId: string,
  input: { file: File; docType: DocumentType; title: string; expiresOn: string; note: string },
): Promise<UploadResult> {
  try {
    const { data, response, error } = await api.POST("/api/v1/hr/employees/{id}/documents", {
      params: { path: { id: employeeId } },
      // The generated type calls the file a string; the serializer below sends the real File.
      body: { docType: input.docType, file: "" },
      bodySerializer: () => {
        const form = new FormData();
        form.append("docType", input.docType);
        form.append("title", input.title.trim());
        if (input.expiresOn) form.append("expiresOn", input.expiresOn);
        form.append("note", input.note.trim());
        form.append("file", input.file);
        return form;
      },
    });
    if (data) return { ok: true };
    return failure(response, error, "The document could not be uploaded. Try again.");
  } catch {
    return { ok: false, status: 0, message: "Cannot reach the server. Check your connection and try again.", fields: {} };
  }
}
