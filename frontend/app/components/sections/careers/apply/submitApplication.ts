"use server";

import { headers } from "next/headers";
import { getJob, isJobSlug, jobsEndpoint, type Job } from "@/lib/careers";
import { getMailer } from "@/lib/mailer";
import { createLimiter } from "@/lib/throttle";
import { JOB_TYPE_LABEL, WORK_MODE_LABEL } from "../careers";
import { readDraft, resumeError, validateApplication, type ApplicationDraft, type FieldErrors } from "./application";
import { renderApplicationConfirmation } from "./applicationEmail";

export type ApplicationResult = { ok: true; email: string } | { ok: false; error: string; fieldErrors?: FieldErrors };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_DRAFT_CHARS = 200_000;
const GENERIC_ERROR = "We couldn't send your application right now. Please try again in a moment.";

// The backend cannot limit by visitor (every request comes from this server), so the limits live here.
const perIp = createLimiter(10 * 60 * 1000, 5);
// The confirmation goes to an address the candidate typed, so it is capped per address: nobody can use the form to flood
// someone else's inbox.
const perAddress = createLimiter(60 * 60 * 1000, 3);

// Sends a job application to the backend (the recruitment module), which stores it and the resume, then emails the candidate a
// confirmation. Nothing is emailed unless the application was stored. The browser never sees the backend or its key.
export async function submitApplication(data: FormData): Promise<ApplicationResult> {
  const value = (key: string) => String(data.get(key) ?? "").trim();

  // Honeypot: hidden from people, bots fill it. Pretend success so they don't retry.
  if (value("website")) return { ok: true, email: "" };

  const slug = value("jobSlug");
  const rawDraft = String(data.get("draft") ?? "");
  const file = data.get("resume");
  if (!isJobSlug(slug) || rawDraft.length > MAX_DRAFT_CHARS || !(file instanceof File)) {
    return { ok: false, error: "Please check the form and try again." };
  }

  let draft: ApplicationDraft | null = null;
  try {
    draft = readDraft(JSON.parse(rawDraft));
  } catch {
    // falls through to the check below
  }
  if (!draft) return { ok: false, error: "Please check the form and try again." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!perIp.allow(ip)) return { ok: false, error: "Too many applications from this connection. Please try again later." };

  // Read fresh (not the cached page copy): what matters is whether the job accepts applications right now.
  const found = await getJob(slug, { fresh: true });
  if (found.status === "not-found") return { ok: false, error: "This position could not be found." };
  if (found.status === "error") return { ok: false, error: GENERIC_ERROR };
  const job = found.job;
  if (!job.acceptingApplications) return { ok: false, error: "This position is no longer accepting applications." };

  const fieldErrors = validateApplication(draft, job.questions, file);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Please fix the highlighted fields and try again.", fieldErrors };
  }

  // A real PDF starts with %PDF-. The backend checks this too; refusing here saves an upload.
  const bytes = Buffer.from(await file.arrayBuffer());
  const problem = resumeError({ name: file.name, size: bytes.length, type: file.type });
  if (problem || bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return {
      ok: false,
      error: "Please check the form and try again.",
      fieldErrors: { resume: problem ?? "The resume must be a PDF file." },
    };
  }

  const submissionId = UUID_RE.test(value("submissionId")) ? value("submissionId") : crypto.randomUUID();
  const outcome = await store(job, submissionId, draft, bytes, file.name);
  if (!outcome.ok) return outcome;

  await confirmToCandidate(job, draft, outcome.id);
  return { ok: true, email: draft.email.trim() };
}

type Stored = { ok: true; id: string } | { ok: false; error: string; fieldErrors?: FieldErrors };

async function store(job: Job, submissionId: string, draft: ApplicationDraft, pdf: Buffer, fileName: string): Promise<Stored> {
  const url = jobsEndpoint(`/${job.slug}/applications`);
  const key = process.env.LEAD_INGEST_KEY;
  if (!url || !key) {
    console.error("[careers] CRM_API_URL or LEAD_INGEST_KEY is not set, so applications cannot be stored");
    return { ok: false, error: GENERIC_ERROR };
  }

  const answered = job.questions.filter((question) => (draft.answers[question.id] ?? "").trim() !== "");
  const payload = {
    submissionId,
    fullName: draft.fullName.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    githubUrl: draft.githubUrl.trim(),
    linkedinUrl: draft.linkedinUrl.trim(),
    educations: draft.educations.map((row) => ({
      degree: row.degree.trim(),
      fieldOfStudy: row.fieldOfStudy.trim(),
      institution: row.institution.trim(),
      completedOn: row.ongoing ? null : row.completedOn,
      ongoing: row.ongoing,
      grade: row.grade.trim(),
    })),
    experiences: draft.experiences.map((row) => ({
      company: row.company.trim(),
      title: row.title.trim(),
      fromOn: row.fromOn,
      toOn: row.current ? null : row.toOn,
      current: row.current,
      responsibilities: row.responsibilities.trim(),
    })),
    answers: answered.map((question) => ({ questionId: question.id, answer: draft.answers[question.id].trim() })),
    consent: true,
  };

  const body = new FormData();
  body.set("payload", JSON.stringify(payload));
  body.set("resume", new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), fileName);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "x-ingest-key": key },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    if (response.ok) {
      const result: unknown = await response.json();
      const id = typeof result === "object" && result !== null ? (result as { id?: unknown }).id : undefined;
      return { ok: true, id: typeof id === "string" ? id : "" };
    }

    const error = await readError(response);
    if (response.status === 409 && error.code === "ALREADY_APPLIED") {
      return { ok: false, error: "You have already applied for this position." };
    }
    if (response.status === 409 && error.code === "NOT_ACCEPTING_APPLICATIONS") {
      return { ok: false, error: "This position is no longer accepting applications." };
    }
    if (response.status === 400) {
      const fieldErrors = mapDetails(
        error.details,
        payload.answers.map((answer) => answer.questionId),
      );
      if (Object.keys(fieldErrors).length > 0) {
        return { ok: false, error: "Please fix the highlighted fields and try again.", fieldErrors };
      }
      // The backend's own messages for a bad file or request are written for people
      return { ok: false, error: error.message ?? GENERIC_ERROR };
    }
    console.error("[careers] the backend refused an application, status", response.status, error.code ?? "");
    return { ok: false, error: GENERIC_ERROR };
  } catch (err) {
    console.error("[careers] could not reach the backend:", err instanceof Error ? err.message : err);
    return { ok: false, error: GENERIC_ERROR };
  }
}

type BackendError = { code?: string; message?: string; details?: unknown };

async function readError(response: Response): Promise<BackendError> {
  try {
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return {};
    const { code, message, details } = body as Record<string, unknown>;
    return {
      code: typeof code === "string" ? code : undefined,
      message: typeof message === "string" ? message : undefined,
      details,
    };
  } catch {
    return {};
  }
}

// Backend issue paths (`educations.0.completedOn`, `answers.2.answer`, `email`) become the form's field keys. An answer is
// addressed by its place in the payload, so it is mapped back to its question id.
function mapDetails(details: unknown, answeredIds: string[]): FieldErrors {
  const errors: FieldErrors = {};
  if (!Array.isArray(details)) return errors;
  for (const item of details) {
    if (typeof item !== "object" || item === null) continue;
    const { path, message } = item as { path?: unknown; message?: unknown };
    if (typeof path !== "string" || typeof message !== "string") continue;
    const answer = /^answers\.(\d+)(?:\.|$)/.exec(path);
    const key = answer ? (answeredIds[Number(answer[1])] ? `answers.${answeredIds[Number(answer[1])]}` : "") : path;
    if (key && !errors[key]) errors[key] = message;
  }
  return errors;
}

// The confirmation is a courtesy: the application is already stored, so a failure here is logged and the candidate still sees
// success. Capped per address (see above).
async function confirmToCandidate(job: Job, draft: ApplicationDraft, applicationId: string): Promise<void> {
  const mail = getMailer("careers");
  if (!mail) return;
  const email = draft.email.trim();
  if (!perAddress.allow(email.toLowerCase())) {
    console.warn("[careers] confirmation skipped: too many for one address");
    return;
  }
  const { subject, html, text } = renderApplicationConfirmation({
    name: draft.fullName.trim(),
    jobTitle: job.title,
    jobType: JOB_TYPE_LABEL[job.jobType],
    workMode: WORK_MODE_LABEL[job.workMode],
    appliedOn: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    }).format(new Date()),
    // The end of a UUIDv7 is the random part (the start is the timestamp, so it repeats within a minute)
    reference: applicationId ? applicationId.replace(/-/g, "").slice(-8).toUpperCase() : "-",
  });
  try {
    await mail.transport.sendMail({
      from: { name: "AWTOMATIG Careers", address: mail.from },
      to: { name: draft.fullName.trim(), address: email },
      replyTo: mail.team[0],
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error("[careers] confirmation email failed:", err instanceof Error ? err.message : err);
  }
}
