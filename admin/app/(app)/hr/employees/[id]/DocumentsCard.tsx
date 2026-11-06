"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useRef, useState } from "react";

import {
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  DataTable,
  Dialog,
  Field,
  IconButton,
  Input,
  InlineError,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiFieldErrors, apiMessage } from "@/lib/api/errors";
import { formatDate, formatFileSize } from "@/lib/format";
import {
  DOCUMENT_ACCEPT,
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPES,
  type DocumentType,
  documentFileProblem,
  documentName,
  type EmployeeDocument,
  expiryState,
  uploadDocument,
} from "@/lib/hr/documents";

/** The same “DELETE/PATCH” answer handling for every dialog here: a message for the person, and field messages when there are any. */
function describeFailure(status: number, error: unknown, fallback: string) {
  const fields = apiFieldErrors(error);
  return {
    fields,
    message:
      status === 403
        ? "You do not have permission to do this."
        : Object.keys(fields).length > 0
          ? "Some details need another look. They are marked above."
          : apiMessage(error, fallback),
  };
}

/**
 * Opens a document in a new tab. The file is private: each click asks the backend for a link that works for five minutes (and the
 * backend records the request), then the new tab goes to it. The tab is opened first, in the click itself, because browsers block
 * a window that is opened after waiting for a network reply.
 */
function OpenButton({ employeeId, documentId }: { employeeId: string; documentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setError(null);
    const tab = window.open("about:blank", "_blank");
    setPending(true);
    try {
      const {
        data,
        response,
        error: failure,
      } = await api.GET("/api/v1/hr/employees/{id}/documents/{docId}/link", {
        params: { path: { id: employeeId, docId: documentId } },
      });
      if (response.status === 401) {
        tab?.close();
        return router.replace("/login");
      }
      if (!data) {
        tab?.close();
        return setError(
          response.status === 403
            ? "You do not have permission to open documents."
            : apiMessage(failure, "The document could not be opened. Try again."),
        );
      }
      if (!tab) return setError("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
      // The file lives on another site: cut the tab off from this one before it goes there.
      tab.opener = null;
      tab.location.href = data.url;
    } catch {
      tab?.close();
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button size="sm" icon={<FileText strokeWidth={1.5} />} disabled={pending} onClick={open}>
        {pending ? "Opening" : "Open"}
      </Button>
      {error && <InlineError className="mt-8 max-w-240">{error}</InlineError>}
    </div>
  );
}

/** Adds one document row with its file. The type of the file is read by the backend from its bytes; the checks here are feedback. */
function AddDialog({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const router = useRouter();
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocumentType>("nid");
  const [title, setTitle] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [pending, setPending] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const problems: Record<string, string> = {};
  if (!file) problems.file = "Choose the file to upload";
  else {
    const fileProblem = documentFileProblem(file);
    if (fileProblem) problems.file = fileProblem;
  }
  if (docType === "other" && !title.trim()) problems.title = "Give the document a title";
  if (title.length > 100) problems.title = "Use 100 characters or fewer";
  if (note.length > 300) problems.note = "Use 300 characters or fewer";
  const shown = (field: string) => serverErrors[field] ?? (attempted ? problems[field] : undefined);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setFormError(null);
    if (Object.keys(problems).length > 0 || !file) return;
    setPending(true);
    const result = await uploadDocument(employeeId, { file, docType, title, expiresOn, note });
    setPending(false);
    if (!result.ok && result.status === 401) return router.replace("/login");
    if (!result.ok) {
      setServerErrors(result.fields);
      setFormError(
        Object.keys(result.fields).length > 0 ? "Some details need another look. They are marked above." : result.message,
      );
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Add a document"
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={`${id}-form`} variant="primary" disabled={pending}>
            {pending ? "Uploading" : "Upload document"}
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={submit} noValidate>
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-20">
          <Field id={`${id}-type`} label="Type" required>
            <Select id={`${id}-type`} value={docType} onChange={(event) => setDocType(event.target.value as DocumentType)}>
              {DOCUMENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {DOCUMENT_TYPE_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            id={`${id}-title`}
            label="Title"
            required={docType === "other"}
            helper={docType === "other" ? undefined : "Optional. The type is used when this is empty."}
            error={shown("title")}
          >
            <Input
              id={`${id}-title`}
              maxLength={100}
              autoComplete="off"
              value={title}
              invalid={Boolean(shown("title"))}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field id={`${id}-file`} label="File" required helper="PDF, JPEG, PNG or WebP, 5 MB at most." error={shown("file")}>
            <input
              ref={fileInput}
              id={`${id}-file`}
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="type-body-14 file:rounded-6 file:border-border file:bg-surface file:hover:bg-surface-subtle file:text-fg-strong w-full file:mr-12 file:h-40 file:cursor-pointer file:border file:px-16 file:font-semibold file:uppercase"
              aria-invalid={Boolean(shown("file")) || undefined}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setServerErrors({});
              }}
            />
            {file && <p className="type-body-14 text-fg-muted mt-6">{`${file.name} · ${formatFileSize(file.size)}`}</p>}
          </Field>
          <Field
            id={`${id}-expires`}
            label="Expires on"
            helper="Optional, for documents that lapse, such as a passport."
            error={shown("expiresOn")}
          >
            <Input id={`${id}-expires`} type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} />
          </Field>
          <Field id={`${id}-note`} label="Note" helper="Optional." error={shown("note")}>
            <Textarea
              id={`${id}-note`}
              maxLength={300}
              className="min-h-80"
              value={note}
              invalid={Boolean(shown("note"))}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
        </fieldset>
        {formError && <InlineError className="mt-12">{formError}</InlineError>}
      </form>
    </Dialog>
  );
}

/** Changes the title, expiry and note. The file and its type cannot change: upload a new one and remove this one. */
function EditDialog({ employeeId, document, onClose }: { employeeId: string; document: EmployeeDocument; onClose: () => void }) {
  const router = useRouter();
  const id = useId();
  const [title, setTitle] = useState(document.title);
  const [expiresOn, setExpiresOn] = useState(document.expiresOn ?? "");
  const [note, setNote] = useState(document.note);
  const [pending, setPending] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const body: { title?: string; expiresOn?: string | null; note?: string } = {};
    if (title.trim() !== document.title) body.title = title.trim();
    if ((expiresOn || null) !== document.expiresOn) body.expiresOn = expiresOn || null;
    if (note.trim() !== document.note) body.note = note.trim();
    if (Object.keys(body).length === 0) return setFormError("Nothing has changed yet.");
    if (document.docType === "other" && body.title === "") return setServerErrors({ title: "Give the document a title" });
    setPending(true);
    try {
      const { response, error } = await api.PATCH("/api/v1/hr/employees/{id}/documents/{docId}", {
        params: { path: { id: employeeId, docId: document.id } },
        body,
      });
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        const failure = describeFailure(response.status, error, "The document could not be saved. Try again.");
        setServerErrors(failure.fields);
        setFormError(failure.message);
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setFormError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit ${documentName(document)}`}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form={`${id}-form`} variant="primary" disabled={pending}>
            {pending ? "Saving" : "Save changes"}
          </Button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={submit} noValidate>
        <p className="text-fg-muted">
          {DOCUMENT_TYPE_LABEL[document.docType]} · {document.fileName}. To replace the file, add a new document and remove this
          one.
        </p>
        <fieldset disabled={pending} className="mt-16 flex min-w-0 flex-col gap-20">
          <Field id={`${id}-title`} label="Title" required={document.docType === "other"} error={serverErrors.title}>
            <Input
              id={`${id}-title`}
              maxLength={100}
              autoComplete="off"
              value={title}
              invalid={Boolean(serverErrors.title)}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field id={`${id}-expires`} label="Expires on" helper="Empty means it does not expire." error={serverErrors.expiresOn}>
            <Input id={`${id}-expires`} type="date" value={expiresOn} onChange={(event) => setExpiresOn(event.target.value)} />
          </Field>
          <Field id={`${id}-note`} label="Note" error={serverErrors.note}>
            <Textarea
              id={`${id}-note`}
              maxLength={300}
              className="min-h-80"
              value={note}
              invalid={Boolean(serverErrors.note)}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
        </fieldset>
        {formError && <InlineError className="mt-12">{formError}</InlineError>}
      </form>
    </Dialog>
  );
}

function RemoveDialog({
  employeeId,
  document,
  onClose,
}: {
  employeeId: string;
  document: EmployeeDocument;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    try {
      const { response, error: failure } = await api.DELETE("/api/v1/hr/employees/{id}/documents/{docId}", {
        params: { path: { id: employeeId, docId: document.id } },
      });
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setError(describeFailure(response.status, failure, "That did not work. Try again.").message);
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ConfirmDialog
      open
      destructive
      onClose={onClose}
      title={`Remove ${documentName(document)}?`}
      confirmLabel="Remove document"
      pendingLabel="Removing"
      pending={pending}
      error={error}
      onConfirm={run}
    >
      <p>
        The file {document.fileName} ({formatFileSize(document.sizeBytes)}) is deleted from storage. This cannot be undone.
      </p>
    </ConfirmDialog>
  );
}

type Dialogs =
  { kind: "add" } | { kind: "edit"; document: EmployeeDocument } | { kind: "remove"; document: EmployeeDocument } | null;

/**
 * The employee's documents (NID, passport, contract, …): as many rows as needed, each a private file. A row can be opened (a
 * link that works for five minutes), edited (title, expiry, note) or removed. A document that has lapsed, or lapses within 30 days,
 * shows a dot beside its expiry date.
 */
export function DocumentsCard({
  employeeId,
  documents,
  canManage,
}: {
  employeeId: string;
  documents: readonly EmployeeDocument[];
  canManage: boolean;
}) {
  const [dialog, setDialog] = useState<Dialogs>(null);

  const columns: ColumnDef<EmployeeDocument>[] = [
    {
      id: "document",
      header: "Document",
      cell: ({ row }) => (
        <div className="py-6">
          <p className="text-fg-strong font-medium">{documentName(row.original)}</p>
          <p className="text-fg-muted">
            {DOCUMENT_TYPE_LABEL[row.original.docType]} · {row.original.fileName} · {formatFileSize(row.original.sizeBytes)}
          </p>
          {row.original.note && <p className="text-fg-muted">{row.original.note}</p>}
        </div>
      ),
    },
    {
      id: "expires",
      header: "Expiry",
      cell: ({ row }) => {
        const state = expiryState(row.original.expiresOn);
        return state ? (
          <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
        ) : (
          <span className="text-fg-muted">No expiry</span>
        );
      },
    },
    {
      id: "added",
      header: "Added",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDate(row.original.createdAt)}
          {row.original.uploadedBy && <span className="text-fg-muted"> · {row.original.uploadedBy}</span>}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-start justify-end gap-8">
          <OpenButton employeeId={employeeId} documentId={row.original.id} />
          {canManage && (
            <>
              <IconButton
                label={`Edit ${documentName(row.original)}`}
                icon={<Pencil strokeWidth={1.5} />}
                onClick={() => setDialog({ kind: "edit", document: row.original })}
              />
              <IconButton
                label={`Remove ${documentName(row.original)}`}
                icon={<Trash2 strokeWidth={1.5} />}
                onClick={() => setDialog({ kind: "remove", document: row.original })}
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card aria-labelledby="documents-title">
      <CardHeader
        id="documents-title"
        title="Documents"
        subtitle="Kept in private storage. Each file opens through a link that works for five minutes."
        action={
          canManage ? (
            <Button size="sm" icon={<Plus strokeWidth={1.5} />} onClick={() => setDialog({ kind: "add" })}>
              Add document
            </Button>
          ) : undefined
        }
      />
      <div className="border-border mt-16 border-t">
        <DataTable
          columns={columns}
          data={documents}
          caption="Documents"
          emptyMessage={canManage ? "No documents yet. Add the NID, passport or contract." : "No documents yet."}
        />
      </div>
      {dialog?.kind === "add" && <AddDialog employeeId={employeeId} onClose={() => setDialog(null)} />}
      {dialog?.kind === "edit" && (
        <EditDialog employeeId={employeeId} document={dialog.document} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "remove" && (
        <RemoveDialog employeeId={employeeId} document={dialog.document} onClose={() => setDialog(null)} />
      )}
    </Card>
  );
}
