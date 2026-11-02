import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import {
  createJobSchema,
  JOB_STATUSES,
  JOB_TYPES,
  listJobsQuerySchema,
  reopenJobSchema,
  updateJobSchema,
  WORK_MODES,
} from "../domain/job";

const iso = z.iso.datetime();

// `.nullable()` on a response field comes out as an array type in openapi.json (a nestjs-zod quirk), so spell the union out.
const orNull = <T extends z.ZodType>(schema: T) => z.union([schema, z.null()]);

// A pattern keeps this a plain string in openapi.json (a bare nullable string turns into an array there).
const amountString = z.string().regex(/^\d+(\.\d+)?$/);

const jobSummary = z.object({
  id: z.uuid(),
  slug: z.string(),
  title: z.string(),
  jobType: z.enum(JOB_TYPES),
  workMode: z.enum(WORK_MODES),
  vacancies: z.number().int(),
  location: z.string(),
  /** Last day applications are accepted, `YYYY-MM-DD`, Dhaka time. */
  deadlineOn: z.iso.date(),
  status: z.enum(JOB_STATUSES),
  /** True while the job is open and its deadline day (Dhaka) has not passed. An open job past its deadline is "expired". */
  acceptingApplications: z.boolean(),
  publishedAt: orNull(iso),
  createdAt: iso,
  /** Applications received, and how many of them are still `new`. */
  applicationCount: z.number().int(),
  newApplicationCount: z.number().int(),
});

const jobDetail = jobSummary.extend({
  /** Decimal strings in BDT, or null. Both null = "Negotiable". */
  salaryMin: orNull(amountString),
  salaryMax: orNull(amountString),
  salaryCurrency: z.literal("BDT"),
  officeTiming: z.string(),
  description: z.string(),
  requirements: z.string(),
  benefits: z.string(),
  closedAt: orNull(iso),
  updatedAt: iso,
  /** Active screening questions in display order. */
  questions: z.array(z.object({ id: z.uuid(), position: z.number().int(), text: z.string(), required: z.boolean() })),
});

export class CreateJobDto extends createZodDto(createJobSchema) {}
export class UpdateJobDto extends createZodDto(updateJobSchema) {}
export class ReopenJobDto extends createZodDto(reopenJobSchema) {}
export class JobIdParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
export class ListJobsQueryDto extends createZodDto(listJobsQuerySchema) {}

export class JobDto extends createZodDto(jobDetail) {}
export class JobListDto extends createZodDto(
  z.object({ items: z.array(jobSummary), total: z.number().int(), page: z.number().int(), pageSize: z.number().int() }),
) {}
