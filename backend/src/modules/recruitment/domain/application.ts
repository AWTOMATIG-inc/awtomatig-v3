import { z } from "zod";

import { AppError } from "../../../shared/errors/app-error";
import { MAX_QUESTIONS } from "./job";

/** Where an application is in the hiring process. `new` means nobody has looked at it yet. */
export const APPLICATION_STATUSES = ["new", "shortlisted", "interview", "hired", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_SORT_FIELDS = ["createdAt", "fullName", "status"] as const;
export type ApplicationSortField = (typeof APPLICATION_SORT_FIELDS)[number];

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const MAX_EDUCATIONS = 10;
export const MAX_EXPERIENCES = 15;
export const MAX_ANSWER_LENGTH = 2000;

/** How long an employee's link to a resume stays valid. */
export const RESUME_LINK_SECONDS = 300;

/** The candidate already applied to this job with the same email or phone number. */
export class AlreadyAppliedError extends AppError {
  constructor() {
    super("conflict", "ALREADY_APPLIED", "You have already applied for this position");
  }
}

/** The job is published but closed, or its deadline has passed. */
export class NotAcceptingApplicationsError extends AppError {
  constructor() {
    super("conflict", "NOT_ACCEPTING_APPLICATIONS", "This position is no longer accepting applications");
  }
}

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Reduces a phone number to digits so the same person typing it two ways is recognised: `01712345678`, `+8801712345678`,
 * `8801712345678`, `008801712345678`, `+88 01712-345678` and `1712345678` all become `8801712345678`. Bangladesh mobile numbers
 * (013 to 019) are checked strictly; any other country needs a `+` or `00` prefix. Returns `null` when it is not a usable number.
 */
export function normalizePhone(raw: string): string | null {
  const compact = raw.trim().replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(compact)) return null;
  const plus = compact.startsWith("+");
  let number = plus ? compact.slice(1) : compact;

  let international = plus;
  if (!plus && number.startsWith("00")) {
    number = number.slice(2);
    international = true;
  }

  if (international) {
    if (number.startsWith("880")) return /^8801[3-9]\d{8}$/.test(number) ? number : null;
    return /^[1-9]\d{7,14}$/.test(number) ? number : null;
  }
  // Without a prefix: a Bangladesh mobile, with or without the leading zero or the country code.
  if (/^01[3-9]\d{8}$/.test(number)) return `880${number.slice(1)}`;
  if (/^1[3-9]\d{8}$/.test(number)) return `880${number}`;
  if (/^8801[3-9]\d{8}$/.test(number)) return number;
  return null;
}

function isProfileUrl(value: string, host: string): boolean {
  try {
    const url = new URL(value);
    const name = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password && (name === host || name.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

/** An optional `https://` link on the given site. Empty becomes `null`. */
const profileUrl = (host: string, label: string) =>
  z
    .string()
    .trim()
    .max(300)
    .default("")
    .refine((value) => value === "" || isProfileUrl(value, host), {
      message: `Enter a full https:// link to your ${label} profile`,
    })
    .transform((value) => (value === "" ? null : value));

const text200 = z.string().trim().min(1).max(200);

const educationSchema = z
  .object({
    degree: text200,
    fieldOfStudy: text200,
    institution: text200,
    /** The completion date, or `null` while the degree is ongoing. */
    completedOn: z.iso.date().nullable().default(null),
    ongoing: z.boolean().default(false),
    grade: z
      .string()
      .trim()
      .max(50)
      .default("")
      .transform((value) => (value === "" ? null : value)),
  })
  .refine((value) => (value.completedOn !== null) !== value.ongoing, {
    path: ["completedOn"],
    message: "Give a completion date, or mark the degree as ongoing (not both)",
  });

const experienceSchema = z
  .object({
    company: text200,
    title: text200,
    fromOn: z.iso.date(),
    /** The last day, or `null` for the current job. */
    toOn: z.iso.date().nullable().default(null),
    current: z.boolean().default(false),
    responsibilities: z.string().trim().min(1).max(MAX_ANSWER_LENGTH),
  })
  .refine((value) => (value.toOn !== null) !== value.current, {
    path: ["toOn"],
    message: "Give an end date, or mark the job as current (not both)",
  })
  .refine((value) => value.toOn === null || value.toOn >= value.fromOn, {
    path: ["toOn"],
    message: "The end date cannot be before the start date",
  });

/** What the website sends in the `payload` field. The website checks the same limits; the backend never trusts that. */
export const applicationPayloadSchema = z.object({
  /** One id per form submission. A retry with the same id returns the stored application instead of adding a second one. */
  submissionId: z.uuid(),
  fullName: text200,
  email: z.string().trim().max(200).pipe(z.email()),
  phone: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .refine((value) => normalizePhone(value) !== null, { message: "Enter a valid phone number" }),
  githubUrl: profileUrl("github.com", "GitHub"),
  linkedinUrl: profileUrl("linkedin.com", "LinkedIn"),
  educations: z.array(educationSchema).min(1, "Add at least one education").max(MAX_EDUCATIONS),
  experiences: z.array(experienceSchema).max(MAX_EXPERIENCES).default([]),
  answers: z
    .array(z.object({ questionId: z.uuid(), answer: z.string().trim().max(MAX_ANSWER_LENGTH) }))
    .max(MAX_QUESTIONS)
    .default([]),
  /** The candidate ticked the Privacy Policy box. Anything else is rejected. */
  consent: z.literal(true),
});
export type ApplicationPayload = z.infer<typeof applicationPayloadSchema>;

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(APPLICATION_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(APPLICATION_SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;

export const updateApplicationSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES).optional(),
    /** Internal notes. `null` or an empty string clears them. */
    notes: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((value) => value.status !== undefined || value.notes !== undefined, { message: "Send a status or notes to change" });
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export interface ResumeFile {
  filename: string;
  mimetype: string;
  buffer: Buffer;
}

/** A message when the resume cannot be accepted, otherwise null. Only a real PDF passes: name, type and the `%PDF-` header. */
export function resumeProblem(file: ResumeFile | null): string | null {
  if (!file) return "Attach your resume as a PDF";
  if (file.buffer.length === 0) return "The resume file is empty";
  if (file.buffer.length > MAX_RESUME_BYTES) return "The resume must be 5 MB or smaller";
  if (!file.filename.toLowerCase().endsWith(".pdf") || file.mimetype !== "application/pdf")
    return "The resume must be a PDF file";
  if (file.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") return "The resume is not a valid PDF file";
  return null;
}

/** The file name as the candidate named it, for display only: no folders, no control characters, at most 200 characters. */
export function displayFileName(filename: string): string {
  // eslint-disable-next-line no-control-regex -- stripping control characters is the point
  const base = (filename.split(/[\\/]/).pop() ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return (base || "resume.pdf").slice(-200);
}

/** A folder or file name that is safe inside an object key: letters and digits of any script, spaces and . _ - ( ) only. */
function safeSegment(value: string, max: number, fallback: string): string {
  const cleaned = value
    .replace(/[^\p{L}\p{M}\p{N} ._()-]/gu, "_")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/^[ .]+|[ .]+$/g, "")
    .slice(0, max)
    .replace(/[ .]+$/g, "");
  // Nothing readable left (a title of only punctuation): use the fallback rather than a folder called "_"
  return /[\p{L}\p{N}]/u.test(cleaned) ? cleaned : fallback;
}

/** The folder a job's resumes go in: the job title, made safe. Reposting the same title reuses the folder. */
export function resumeFolder(jobTitle: string): string {
  return safeSegment(jobTitle, 80, "job");
}

/** The candidate's own file name, made safe for an object key: no folders, odd characters or leading dots, and always `.pdf`. */
export function resumeFileName(filename: string): string {
  const stem = displayFileName(filename).replace(/\.pdf$/i, "");
  return `${safeSegment(stem, 120, "resume")}.pdf`;
}

/**
 * Where a resume is stored, in the order to try: `career/<job title>/<file name>.pdf`, then the same name with a short id from the
 * application, then with the whole id. Two candidates often upload `resume.pdf`, and an upload never replaces another's file: the
 * first free name wins. The chosen key is saved with the application, so a later title change never loses a file.
 */
export function resumeKeyCandidates(jobTitle: string, filename: string, applicationId: string): string[] {
  const folder = resumeFolder(jobTitle);
  const name = resumeFileName(filename).replace(/\.pdf$/, "");
  const compact = applicationId.replace(/-/g, "");
  return [name, `${name}-${compact.slice(-8)}`, `${name}-${compact}`].map((file) => `career/${folder}/${file}.pdf`);
}
