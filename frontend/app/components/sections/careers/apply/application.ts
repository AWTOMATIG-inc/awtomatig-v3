import type { JobQuestion } from "@/lib/careers";

// The application model and its checks, shared by the form (so mistakes show before sending) and the Server Action (which
// never trusts the browser). The limits repeat the backend's (recruitment/domain/application.ts), which is the final judge.

export const LIMITS = {
  educations: 10,
  experiences: 15,
  text: 200,
  email: 200,
  phone: 30,
  link: 300,
  grade: 50,
  answer: 2000,
  resumeBytes: 5 * 1024 * 1024,
} as const;

export type Education = {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  /** YYYY-MM-DD, empty while ongoing */
  completedOn: string;
  ongoing: boolean;
  grade: string;
};

export type Experience = {
  company: string;
  title: string;
  /** YYYY-MM-DD */
  fromOn: string;
  /** YYYY-MM-DD, empty for the current job */
  toOn: string;
  current: boolean;
  responsibilities: string;
};

export type ApplicationDraft = {
  fullName: string;
  email: string;
  phone: string;
  githubUrl: string;
  linkedinUrl: string;
  educations: Education[];
  experiences: Experience[];
  /** Answer text by question id */
  answers: Record<string, string>;
  consent: boolean;
};

/** Error messages by field path: `fullName`, `educations.0.degree`, `experiences.1.toOn`, `answers.<questionId>`, `resume`, ... */
export type FieldErrors = Record<string, string>;

export const EMPTY_EDUCATION: Education = {
  degree: "",
  fieldOfStudy: "",
  institution: "",
  completedOn: "",
  ongoing: false,
  grade: "",
};

export const EMPTY_EXPERIENCE: Experience = {
  company: "",
  title: "",
  fromOn: "",
  toOn: "",
  current: false,
  responsibilities: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Same rule as the backend: Bangladesh mobiles (013 to 019) in any common spelling, or another country with a + or 00 prefix.
export function isValidPhone(raw: string): boolean {
  const compact = raw.trim().replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(compact)) return false;
  const plus = compact.startsWith("+");
  let number = plus ? compact.slice(1) : compact;
  let international = plus;
  if (!plus && number.startsWith("00")) {
    number = number.slice(2);
    international = true;
  }
  if (international) {
    if (number.startsWith("880")) return /^8801[3-9]\d{8}$/.test(number);
    return /^[1-9]\d{7,14}$/.test(number);
  }
  return /^01[3-9]\d{8}$/.test(number) || /^1[3-9]\d{8}$/.test(number) || /^8801[3-9]\d{8}$/.test(number);
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

export type ResumeInfo = { name: string; size: number; type: string } | null;

/** The checks a PDF passes before it is sent. The Server Action also checks the file's first bytes. */
export function resumeError(resume: ResumeInfo): string | undefined {
  if (!resume) return "Attach your resume as a PDF.";
  if (!/\.pdf$/i.test(resume.name) || (resume.type !== "" && resume.type !== "application/pdf")) {
    return "The resume must be a PDF file.";
  }
  if (resume.size === 0) return "This file is empty.";
  if (resume.size > LIMITS.resumeBytes) return "The resume must be 5 MB or smaller.";
  return undefined;
}

export function validateApplication(draft: ApplicationDraft, questions: JobQuestion[], resume: ResumeInfo): FieldErrors {
  const errors: FieldErrors = {};
  const text = (path: string, value: string, label: string, max: number = LIMITS.text) => {
    const trimmed = value.trim();
    if (!trimmed) errors[path] = `${label} is required.`;
    else if (trimmed.length > max) errors[path] = `${label} must be ${max} characters or fewer.`;
  };

  text("fullName", draft.fullName, "Your name");

  const email = draft.email.trim();
  if (!email) errors.email = "Your email is required.";
  else if (!EMAIL_RE.test(email) || email.length > LIMITS.email) errors.email = "Enter a valid email address.";

  if (!draft.phone.trim()) errors.phone = "Your phone number is required.";
  else if (draft.phone.length > LIMITS.phone || !isValidPhone(draft.phone)) errors.phone = "Enter a valid phone number.";

  const github = draft.githubUrl.trim();
  if (github && (github.length > LIMITS.link || !isProfileUrl(github, "github.com"))) {
    errors.githubUrl = "Enter a full https:// link to your GitHub profile.";
  }
  const linkedin = draft.linkedinUrl.trim();
  if (linkedin && (linkedin.length > LIMITS.link || !isProfileUrl(linkedin, "linkedin.com"))) {
    errors.linkedinUrl = "Enter a full https:// link to your LinkedIn profile.";
  }

  if (draft.educations.length === 0) errors.educations = "Add at least one education.";
  if (draft.educations.length > LIMITS.educations) errors.educations = `Add at most ${LIMITS.educations} education entries.`;
  draft.educations.forEach((row, i) => {
    text(`educations.${i}.degree`, row.degree, "The degree");
    text(`educations.${i}.fieldOfStudy`, row.fieldOfStudy, "The field of study");
    text(`educations.${i}.institution`, row.institution, "The institution");
    if (row.ongoing) {
      if (row.completedOn) errors[`educations.${i}.completedOn`] = "Clear the date, or untick ongoing.";
    } else if (!isDate(row.completedOn)) {
      errors[`educations.${i}.completedOn`] = "Add the completion date, or tick ongoing.";
    }
    if (row.grade.trim().length > LIMITS.grade)
      errors[`educations.${i}.grade`] = `The grade must be ${LIMITS.grade} characters or fewer.`;
  });

  if (draft.experiences.length > LIMITS.experiences) errors.experiences = `Add at most ${LIMITS.experiences} experience entries.`;
  draft.experiences.forEach((row, i) => {
    text(`experiences.${i}.company`, row.company, "The company");
    text(`experiences.${i}.title`, row.title, "The job title");
    text(`experiences.${i}.responsibilities`, row.responsibilities, "The responsibilities", LIMITS.answer);
    if (!isDate(row.fromOn)) errors[`experiences.${i}.fromOn`] = "Add the start date.";
    if (row.current) {
      if (row.toOn) errors[`experiences.${i}.toOn`] = "Clear the end date, or untick current.";
    } else if (!isDate(row.toOn)) {
      errors[`experiences.${i}.toOn`] = "Add the end date, or tick current.";
    } else if (isDate(row.fromOn) && row.toOn < row.fromOn) {
      errors[`experiences.${i}.toOn`] = "The end date cannot be before the start date.";
    }
  });

  for (const question of questions) {
    const answer = (draft.answers[question.id] ?? "").trim();
    if (question.required && !answer) errors[`answers.${question.id}`] = "This question needs an answer.";
    else if (answer.length > LIMITS.answer)
      errors[`answers.${question.id}`] = `Keep the answer under ${LIMITS.answer} characters.`;
  }

  const resumeProblem = resumeError(resume);
  if (resumeProblem) errors.resume = resumeProblem;

  if (!draft.consent) errors.consent = "Please agree to the Privacy Policy to apply.";
  return errors;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown): string => (typeof value === "string" ? value : "");

/** Narrows the JSON the browser sent. Anything that is not the expected shape becomes empty values, which validation rejects. */
export function readDraft(raw: unknown): ApplicationDraft | null {
  if (!isRecord(raw)) return null;
  const rows = (value: unknown): Record<string, unknown>[] => (Array.isArray(value) ? value.filter(isRecord) : []);
  const answers: Record<string, string> = {};
  if (isRecord(raw.answers)) for (const [id, answer] of Object.entries(raw.answers)) answers[id] = str(answer);
  return {
    fullName: str(raw.fullName),
    email: str(raw.email),
    phone: str(raw.phone),
    githubUrl: str(raw.githubUrl),
    linkedinUrl: str(raw.linkedinUrl),
    educations: rows(raw.educations)
      .slice(0, LIMITS.educations + 1)
      .map((row) => ({
        degree: str(row.degree),
        fieldOfStudy: str(row.fieldOfStudy),
        institution: str(row.institution),
        completedOn: str(row.completedOn),
        ongoing: row.ongoing === true,
        grade: str(row.grade),
      })),
    experiences: rows(raw.experiences)
      .slice(0, LIMITS.experiences + 1)
      .map((row) => ({
        company: str(row.company),
        title: str(row.title),
        fromOn: str(row.fromOn),
        toOn: str(row.toOn),
        current: row.current === true,
        responsibilities: str(row.responsibilities),
      })),
    answers,
    consent: raw.consent === true,
  };
}
