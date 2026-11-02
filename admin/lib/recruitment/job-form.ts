import { z } from "zod";

import type { components } from "@/lib/api/schema";

import type { Job, JobType, WorkMode } from "./jobs";

export type CreateJobBody = components["schemas"]["CreateJobDto"];
export type UpdateJobBody = components["schemas"]["UpdateJobDto"];

/** The same cap as the backend; the form stops adding questions here. */
export const MAX_QUESTIONS = 20;

export interface QuestionValues {
  /** The id of a question that already exists on the job. New questions have none. */
  questionId?: string;
  text: string;
  required: boolean;
}

/** Everything is a string in the form, like the inputs: money in particular is never turned into a JS number. */
export interface JobFormValues {
  title: string;
  jobType: JobType;
  workMode: WorkMode;
  vacancies: string;
  location: string;
  officeTiming: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string;
  benefits: string;
  deadlineOn: string;
  questions: QuestionValues[];
}

/** Today's date in Dhaka (`YYYY-MM-DD`): the company's clock, which is the one a deadline is judged by. */
export function todayInDhaka(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    now,
  );
}

const amount = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{1,13}(\.\d{1,2})?$/.test(value), "Use digits with at most two decimals");

/**
 * The checks that give feedback while typing. The backend repeats all of them and has the final word. A deadline is only
 * checked against today when it was changed, so an opening whose deadline has passed can still be edited.
 */
export function jobFormSchema(options: { initialDeadline: string | null }) {
  return z
    .object({
      title: z.string().trim().min(1, "Enter the position name").max(200, "Use 200 characters or fewer"),
      jobType: z.enum(["full_time", "part_time", "contractual"]),
      workMode: z.enum(["onsite", "remote", "hybrid"]),
      vacancies: z
        .string()
        .trim()
        .regex(/^\d+$/, "Enter a whole number")
        .refine((value) => Number(value) >= 1 && Number(value) <= 1000, "Enter a number from 1 to 1,000"),
      location: z.string().trim().min(1, "Enter the location").max(200, "Use 200 characters or fewer"),
      officeTiming: z.string().trim().min(1, "Enter the office timing").max(200, "Use 200 characters or fewer"),
      salaryMin: amount,
      salaryMax: amount,
      description: z.string().trim().min(1, "Describe the role").max(10_000, "Use 10,000 characters or fewer"),
      requirements: z.string().trim().max(10_000, "Use 10,000 characters or fewer"),
      benefits: z.string().trim().max(10_000, "Use 10,000 characters or fewer"),
      deadlineOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the last day to apply"),
      questions: z
        .array(
          z.object({
            questionId: z.string().optional(),
            text: z.string().trim().min(1, "Write the question, or remove it").max(500, "Use 500 characters or fewer"),
            required: z.boolean(),
          }),
        )
        .max(MAX_QUESTIONS, `At most ${MAX_QUESTIONS} questions`),
    })
    .superRefine((value, context) => {
      if (value.salaryMax && !value.salaryMin) {
        context.addIssue({ code: "custom", path: ["salaryMin"], message: "Enter a minimum before a maximum" });
      } else if (value.salaryMax && value.salaryMin && Number(value.salaryMax) < Number(value.salaryMin)) {
        // Comparing two short decimals as numbers is exact; no arithmetic is done on money here.
        context.addIssue({ code: "custom", path: ["salaryMax"], message: "The maximum cannot be below the minimum" });
      }
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(value.deadlineOn) &&
        value.deadlineOn !== options.initialDeadline &&
        value.deadlineOn < todayInDhaka()
      ) {
        context.addIssue({ code: "custom", path: ["deadlineOn"], message: "The deadline cannot be in the past" });
      }
    });
}

/** Form values for a new opening, or for an existing one. */
export function toFormValues(job?: Job): JobFormValues {
  if (!job) {
    return {
      title: "",
      jobType: "full_time",
      workMode: "onsite",
      vacancies: "1",
      location: "",
      officeTiming: "",
      salaryMin: "",
      salaryMax: "",
      description: "",
      requirements: "",
      benefits: "",
      deadlineOn: "",
      questions: [],
    };
  }
  return {
    title: job.title,
    jobType: job.jobType,
    workMode: job.workMode,
    vacancies: String(job.vacancies),
    location: job.location,
    officeTiming: job.officeTiming,
    salaryMin: job.salaryMin ?? "",
    salaryMax: job.salaryMax ?? "",
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    deadlineOn: job.deadlineOn,
    questions: job.questions.map((question) => ({ questionId: question.id, text: question.text, required: question.required })),
  };
}

function fields(values: JobFormValues) {
  return {
    title: values.title.trim(),
    jobType: values.jobType,
    workMode: values.workMode,
    vacancies: Number(values.vacancies),
    location: values.location.trim(),
    officeTiming: values.officeTiming.trim(),
    description: values.description.trim(),
    requirements: values.requirements.trim(),
    benefits: values.benefits.trim(),
    // Empty means "not given": the API takes null, never an empty string.
    salaryMin: values.salaryMin.trim() || null,
    salaryMax: values.salaryMax.trim() || null,
    deadlineOn: values.deadlineOn,
  };
}

export function toCreateBody(values: JobFormValues, publish: boolean): CreateJobBody {
  return {
    ...fields(values),
    publish,
    questions: values.questions.map((question) => ({ text: question.text.trim(), required: question.required })),
  };
}

/** Sends every field and the whole ordered question list; the backend edits, adds and archives questions to match. */
export function toUpdateBody(values: JobFormValues): UpdateJobBody {
  return {
    ...fields(values),
    questions: values.questions.map((question) => ({
      ...(question.questionId ? { id: question.questionId } : {}),
      text: question.text.trim(),
      required: question.required,
    })),
  };
}
