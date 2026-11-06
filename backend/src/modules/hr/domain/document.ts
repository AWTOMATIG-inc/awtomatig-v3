import { z } from "zod";

import { formatEmployeeId } from "./employee";

export const DOCUMENT_TYPES = ["nid", "passport", "contract", "certificate", "cv", "other"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** The existing upload limit (`MAX_UPLOAD_BYTES` in bootstrap.ts). Scans of passports that are larger are Q12 in the plan. */
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

/** A bound on the profile's document table and on how much one person can fill the bucket. */
export const MAX_DOCUMENTS_PER_EMPLOYEE = 50;

/** How long a signed link to a document works. */
export const DOCUMENT_LINK_SECONDS = 300;

export interface DetectedDocument {
  contentType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  extension: "pdf" | "jpg" | "png" | "webp";
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Works out what an uploaded file really is from its first bytes. Returns `null` for anything that is not a PDF, JPEG, PNG or
 * WebP. The file name and the content type the client sent are never trusted: the stored type and extension come from here.
 */
export function detectDocument(buffer: Buffer): DetectedDocument | null {
  if (buffer.length >= 5 && buffer.toString("latin1", 0, 5) === "%PDF-")
    return { contentType: "application/pdf", extension: "pdf" };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return { contentType: "image/png", extension: "png" };
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (buffer.length >= 12 && buffer.toString("latin1", 0, 4) === "RIFF" && buffer.toString("latin1", 8, 12) === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

const optionalDate = z.iso.date();
const title = z.string().trim().max(100);
const note = z.string().trim().max(300);

/** The text fields that come with the file. An `other` document needs a title so the table says what it is. */
export const documentFieldsSchema = z
  .object({
    docType: z.enum(DOCUMENT_TYPES),
    title: title.default(""),
    expiresOn: optionalDate.optional(),
    note: note.default(""),
  })
  .refine((value) => value.docType !== "other" || value.title.length > 0, {
    path: ["title"],
    message: "Give the document a title",
  });
export type DocumentFields = z.infer<typeof documentFieldsSchema>;

export const updateDocumentSchema = z
  .object({ title, expiresOn: optionalDate.nullable(), note })
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), { message: "Send at least one field to change" });
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

/** A folder or file name that is safe inside an object key: letters and digits of any script, spaces and . _ - ( ) only. */
function safeSegment(value: string, max: number, fallback: string): string {
  const cleaned = value
    .replace(/[^\p{L}\p{M}\p{N} ._()-]/gu, "_")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/^[ .]+|[ .]+$/g, "")
    .slice(0, max)
    .replace(/[ .]+$/g, "");
  return /[\p{L}\p{N}]/u.test(cleaned) ? cleaned : fallback;
}

/** `EMP-0001-jane-doe`: the EMP ID keeps the folder unique and stable, the name keeps it readable. A name with no Latin letters or digits leaves just the EMP ID. */
export function employeeFolder(employeeNo: number, fullName: string): string {
  const slug = fullName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug ? `${formatEmployeeId(employeeNo)}-${slug}` : formatEmployeeId(employeeNo);
}

/** The uploaded name without any folder part and without its extension, as text to show people (not for use in a key). */
export function displayFileName(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? "";
  return base.trim().slice(0, 200) || "document";
}

/**
 * Where a document is stored, in the order to try: `hrm/employees/<EMP-0001-name>/<type>/<file name>.<ext>`, then the same name
 * with a short id from the document, then with the whole id. An upload never replaces another file: the first free name wins. The
 * chosen key is saved with the document, so a later name change never loses a file.
 */
export function documentKeyCandidates(
  folder: string,
  docType: DocumentType,
  filename: string,
  extension: string,
  documentId: string,
): string[] {
  const stem = displayFileName(filename).replace(/\.[A-Za-z0-9]{1,5}$/, "");
  const name = safeSegment(stem, 120, "document");
  const compact = documentId.replace(/-/g, "");
  return [name, `${name}-${compact.slice(-8)}`, `${name}-${compact}`].map(
    (file) => `hrm/employees/${folder}/${docType}/${file}.${extension}`,
  );
}
