import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { APPLICATION_STATUSES, listApplicationsQuerySchema, updateApplicationSchema } from "../domain/application";
import { JOB_TYPES, WORK_MODES } from "../domain/job";

const iso = z.iso.datetime();

// `.nullable()` on a response field comes out as an array type in openapi.json (a nestjs-zod quirk), so spell the union out
// and give the string a pattern or format.
const orNull = <T extends z.ZodType>(schema: T) => z.union([schema, z.null()]);
const amountString = z.string().regex(/^\d+(\.\d+)?$/);

/** What the careers page may see of one opening. An allow-list: nothing internal is included. */
const publicJob = z.object({
  slug: z.string(),
  title: z.string(),
  jobType: z.enum(JOB_TYPES),
  workMode: z.enum(WORK_MODES),
  vacancies: z.number().int(),
  location: z.string(),
  officeTiming: z.string(),
  /** Decimal strings in BDT, or null. Both null = "Negotiable". */
  salaryMin: orNull(amountString),
  salaryMax: orNull(amountString),
  /** Last day applications are accepted, `YYYY-MM-DD`, Dhaka time. */
  deadlineOn: z.iso.date(),
  publishedAt: orNull(iso),
  /** False for a closed or expired job: show the details but no form. */
  acceptingApplications: z.boolean(),
});

const publicJobDetail = publicJob.extend({
  description: z.string(),
  requirements: z.string(),
  benefits: z.string(),
  /** Send each answer back with its `id` as `questionId`. */
  questions: z.array(z.object({ id: z.uuid(), position: z.number().int(), text: z.string(), required: z.boolean() })),
});

const applicationItem = z.object({
  id: z.uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  status: z.enum(APPLICATION_STATUSES),
  createdAt: iso,
});

const applicationDetail = applicationItem.extend({
  jobId: z.uuid(),
  jobTitle: z.string(),
  jobSlug: z.string(),
  githubUrl: orNull(z.url()),
  linkedinUrl: orNull(z.url()),
  resume: z.object({ name: z.string(), size: z.number().int() }),
  /** Empty when there are no notes. */
  notes: z.string(),
  consentedAt: iso,
  updatedAt: iso,
  educations: z.array(
    z.object({
      degree: z.string(),
      fieldOfStudy: z.string(),
      institution: z.string(),
      /** Null while the degree is ongoing. */
      completedOn: orNull(z.iso.date()),
      ongoing: z.boolean(),
      /** Empty when none was given. */
      grade: z.string(),
    }),
  ),
  experiences: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      fromOn: z.iso.date(),
      /** Null for the current job. */
      toOn: orNull(z.iso.date()),
      current: z.boolean(),
      responsibilities: z.string(),
    }),
  ),
  /** Each answer carries the question text as it was when answered. */
  answers: z.array(z.object({ questionId: z.uuid(), question: z.string(), answer: z.string() })),
});

export class PublicJobListDto extends createZodDto(z.object({ items: z.array(publicJob) })) {}
export class PublicJobDto extends createZodDto(publicJobDetail) {}
export class JobSlugParamsDto extends createZodDto(z.object({ slug: z.string().min(1).max(100) })) {}
export class SubmittedApplicationDto extends createZodDto(z.object({ id: z.uuid() })) {}

export class JobApplicationsParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
export class ApplicationIdParamsDto extends createZodDto(z.object({ id: z.uuid() })) {}
export class ListApplicationsQueryDto extends createZodDto(listApplicationsQuerySchema) {}
export class ApplicationListDto extends createZodDto(
  z.object({ items: z.array(applicationItem), total: z.number().int(), page: z.number().int(), pageSize: z.number().int() }),
) {}
export class ApplicationDto extends createZodDto(applicationDetail) {}
export class UpdateApplicationDto extends createZodDto(updateApplicationSchema) {}
export class ResumeLinkDto extends createZodDto(z.object({ url: z.url(), expiresAt: iso })) {}

export class RecruitmentStatsDto extends createZodDto(
  z.object({
    /** Positions that are open and whose last day has not passed. */
    openJobs: z.number().int(),
    /** Of those, how many close within `closingSoonDays` days. */
    closingSoon: z.number().int(),
    closingSoonDays: z.number().int(),
    /** Applications nobody has looked at yet (status `new`). */
    newApplications: z.number().int(),
    /** Of those, how many have waited more than `staleAfterDays` days. */
    staleAfterDays: z.number().int(),
    staleCount: z.number().int(),
    /** The longest-waiting ones, up to six. */
    stale: z.array(z.object({ id: z.uuid(), fullName: z.string(), jobId: z.uuid(), jobTitle: z.string(), createdAt: iso })),
  }),
) {}
