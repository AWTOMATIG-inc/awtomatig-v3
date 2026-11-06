import { Injectable, Logger } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { newId } from "../../../shared/db/columns";
import { Database } from "../../../shared/db/database";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { StorageUnavailableError } from "../../../shared/storage/storage.errors";
import { StorageService } from "../../../shared/storage/storage.service";
import {
  detectDocument,
  DOCUMENT_LINK_SECONDS,
  documentFieldsSchema,
  documentKeyCandidates,
  type DocumentType,
  displayFileName,
  employeeFolder,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENTS_PER_EMPLOYEE,
  type UpdateDocumentInput,
} from "../domain/document";
import { type DocumentPatch, DocumentsRepo } from "../repo/documents.repo";
import { EmployeesRepo } from "../repo/employees.repo";

/** What the controller reads from the multipart request. Nothing here is trusted yet. */
export interface UploadedDocument {
  filename: string;
  buffer: Buffer;
}

interface Row {
  id: string;
  employeeId: string;
  docType: string;
  title: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  expiresOn: string | null;
  note: string;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy: string | null;
}

/**
 * Documents kept for an employee (NID, passport, contract, …). Files go to the private R2 bucket and are opened only through a
 * five-minute signed link; every link issued is audited. Audit entries hold ids and the document type only, never a file name.
 * Object keys contain the employee's name, so they are never logged or returned.
 */
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly database: Database,
    private readonly documents: DocumentsRepo,
    private readonly employees: EmployeesRepo,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async list(employeeId: string) {
    const db = this.database.db;
    if (!(await this.employees.findIdentity(db, employeeId))) throw new NotFoundError("Employee not found");
    const rows = await this.documents.listForEmployee(db, employeeId);
    return { items: rows.map((row) => this.present(row)) };
  }

  /** Checks the file by its content, stores it under the next free name, then records it. A failed record removes the file again. */
  async add(employeeId: string, rawFields: unknown, file: UploadedDocument | null, actorId: string) {
    const parsed = documentFieldsSchema.safeParse(rawFields);
    if (!parsed.success) {
      throw new ValidationError(
        "The document is not valid",
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join(".") || "form", issue.message])),
      );
    }
    const fields = parsed.data;

    const fileProblem = (message: string): never => {
      throw new ValidationError(message, { file: message });
    };
    if (!file) fileProblem("Send a file in the `file` field");
    const upload = file!;
    if (upload.buffer.length === 0) fileProblem("The file is empty");
    if (upload.buffer.length > MAX_DOCUMENT_BYTES)
      fileProblem(`The file must be ${MAX_DOCUMENT_BYTES / (1024 * 1024)} MB or smaller`);
    const detected = detectDocument(upload.buffer);
    if (!detected) return fileProblem("Upload a PDF, JPEG, PNG or WebP file");

    const db = this.database.db;
    const employee = await this.employees.findIdentity(db, employeeId);
    if (!employee) throw new NotFoundError("Employee not found");
    if ((await this.documents.countForEmployee(db, employeeId)) >= MAX_DOCUMENTS_PER_EMPLOYEE) {
      throw new ConflictError(`An employee can have at most ${MAX_DOCUMENTS_PER_EMPLOYEE} documents. Remove one first`);
    }

    const id = newId();
    const key = await this.store(
      documentKeyCandidates(
        employeeFolder(employee.employeeNo, employee.fullName),
        fields.docType,
        upload.filename,
        detected.extension,
        id,
      ),
      upload.buffer,
      detected.contentType,
    );

    try {
      await this.database.transaction(async (tx) => {
        await this.documents.insert(tx, {
          id,
          employeeId,
          docType: fields.docType,
          title: fields.title,
          fileName: displayFileName(upload.filename),
          storageKey: key,
          contentType: detected.contentType,
          sizeBytes: upload.buffer.length,
          expiresOn: fields.expiresOn ?? null,
          note: fields.note,
          createdBy: actorId,
        });
        await this.audit.record(
          {
            action: "hr.document.added",
            actorId,
            entityType: "employee",
            entityId: employeeId,
            metadata: { documentId: id, docType: fields.docType },
          },
          tx,
        );
      });
    } catch (error) {
      await this.discard(key, id);
      throw error;
    }
    return this.get(employeeId, id);
  }

  async get(employeeId: string, id: string) {
    const row = await this.documents.findById(this.database.db, employeeId, id);
    if (!row) throw new NotFoundError("Document not found");
    return this.present(row);
  }

  /** A link to the file that works for five minutes. Every request is written to the audit log. */
  async link(employeeId: string, id: string, actorId: string) {
    const db = this.database.db;
    const stored = await this.documents.findStorage(db, employeeId, id);
    if (!stored) throw new NotFoundError("Document not found");
    if (!(await this.storage.head(stored.storageKey))) throw new NotFoundError("The file is missing from storage");

    const link = await this.storage.signedGetUrl(stored.storageKey, DOCUMENT_LINK_SECONDS);
    await this.audit.record({
      action: "hr.document.viewed",
      actorId,
      entityType: "employee",
      entityId: employeeId,
      metadata: { documentId: id, docType: stored.docType },
    });
    return { url: link.url, expiresAt: link.expiresAt.toISOString() };
  }

  /** The title, expiry and note can change; the file and its type cannot (upload a new one and remove this one instead). */
  async update(employeeId: string, id: string, input: UpdateDocumentInput, actorId: string) {
    await this.database.transaction(async (tx) => {
      const row = await this.documents.findById(tx, employeeId, id);
      if (!row) throw new NotFoundError("Document not found");
      const patch = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as DocumentPatch;
      if (row.docType === "other" && patch.title !== undefined && patch.title.length === 0) {
        throw new ValidationError("Give the document a title", { title: "Give the document a title" });
      }
      await this.documents.update(tx, id, patch, actorId);
      await this.audit.record(
        {
          action: "hr.document.updated",
          actorId,
          entityType: "employee",
          entityId: employeeId,
          metadata: { documentId: id, fields: Object.keys(patch) },
        },
        tx,
      );
    });
    return this.get(employeeId, id);
  }

  /** Removes the row first, then the file. A file that cannot be removed is left behind and logged by id, never lost the other way. */
  async remove(employeeId: string, id: string, actorId: string) {
    const key = await this.database.transaction(async (tx) => {
      const stored = await this.documents.findStorage(tx, employeeId, id);
      if (!stored) throw new NotFoundError("Document not found");
      await this.documents.delete(tx, id);
      await this.audit.record(
        {
          action: "hr.document.removed",
          actorId,
          entityType: "employee",
          entityId: employeeId,
          metadata: { documentId: id, docType: stored.docType },
        },
        tx,
      );
      return stored.storageKey;
    });
    await this.discard(key, id);
  }

  /** Tries the names in order and keeps the first one that is free. An upload never replaces another file. */
  private async store(candidates: string[], body: Buffer, contentType: string): Promise<string> {
    for (const key of candidates) {
      if (await this.storage.putIfAbsent(key, body, contentType)) return key;
    }
    // Every name is taken, which cannot happen for a fresh document id: treat it as a storage problem.
    this.logger.error("No free document name was found");
    throw new StorageUnavailableError();
  }

  private async discard(key: string, documentId: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch {
      this.logger.warn(`Could not remove a stored document file (document ${documentId})`);
    }
  }

  private present(row: Row) {
    return {
      id: row.id,
      docType: row.docType as DocumentType,
      title: row.title,
      fileName: row.fileName,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      expiresOn: row.expiresOn,
      note: row.note,
      uploadedBy: row.uploadedBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
