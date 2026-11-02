import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { authorColumns, baseColumns, money } from "../../shared/db/columns";

/** The recruitment module's own Postgres schema. Only this module's repo reads or writes these tables. */
export const recruitmentSchema = pgSchema("recruitment");

/** A job opening. The public site lists `open` jobs whose deadline has not passed (see `isAcceptingApplications`). */
export const jobs = recruitmentSchema.table(
  "jobs",
  {
    ...baseColumns,
    ...authorColumns,
    /** Built from the title once and never changed, so shared links keep working. */
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    jobType: text("job_type").notNull(),
    workMode: text("work_mode").notNull(),
    salaryMin: money("salary_min"),
    salaryMax: money("salary_max"),
    salaryCurrency: text("salary_currency").notNull().default("BDT"),
    vacancies: integer("vacancies").notNull().default(1),
    officeTiming: text("office_timing").notNull(),
    location: text("location").notNull(),
    description: text("description").notNull(),
    requirements: text("requirements").notNull().default(""),
    benefits: text("benefits").notNull().default(""),
    /** Last day applications are accepted, in Dhaka time. */
    deadlineOn: date("deadline_on", { mode: "string" }).notNull(),
    status: text("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("jobs_slug_key").on(table.slug),
    index("jobs_status_deadline_on_idx").on(table.status, table.deadlineOn),
    index("jobs_created_at_idx").on(table.createdAt),
    check("jobs_job_type_check", sql`${table.jobType} in ('full_time', 'part_time', 'contractual')`),
    check("jobs_work_mode_check", sql`${table.workMode} in ('onsite', 'remote', 'hybrid')`),
    check("jobs_status_check", sql`${table.status} in ('draft', 'open', 'closed')`),
    check("jobs_salary_currency_check", sql`${table.salaryCurrency} = 'BDT'`),
    check("jobs_vacancies_check", sql`${table.vacancies} >= 1`),
    check(
      "jobs_salary_range_check",
      sql`${table.salaryMax} is null or (${table.salaryMin} is not null and ${table.salaryMax} >= ${table.salaryMin})`,
    ),
  ],
);

/**
 * A free-text screening question. Never deleted: a question that was edited out is archived, so applications that answered it
 * (later phase) still make sense.
 */
export const jobQuestions = recruitmentSchema.table(
  "job_questions",
  {
    ...baseColumns,
    ...authorColumns,
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),
    position: integer("position").notNull(),
    text: text("text").notNull(),
    required: boolean("required").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("job_questions_job_id_position_idx").on(table.jobId, table.position),
    check("job_questions_position_check", sql`${table.position} >= 0`),
  ],
);

/**
 * A candidate's application for one job. Personal data: keep it out of logs and the audit log. The database is the last guard
 * against a double application: one per job for each email and each phone number, whatever the code checked first.
 */
export const applications = recruitmentSchema.table(
  "applications",
  {
    ...baseColumns,
    ...authorColumns,
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id),
    /** The website's id for one form submission; makes a retried submission harmless. */
    submissionId: uuid("submission_id").notNull(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    /** Lowercased email, and the phone reduced to digits with Bangladesh numbers made alike (see `normalizePhone`). */
    emailNormalized: text("email_normalized").notNull(),
    phoneNormalized: text("phone_normalized").notNull(),
    githubUrl: text("github_url"),
    linkedinUrl: text("linkedin_url"),
    /** The private R2 object key, `career/<job title>/<file name>.pdf` (a short id is added to the name if it was taken). */
    resumeKey: text("resume_key").notNull(),
    /** The candidate's file name, for display only. */
    resumeName: text("resume_name").notNull(),
    resumeSize: integer("resume_size").notNull(),
    status: text("status").notNull().default("new"),
    notes: text("notes"),
    consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("applications_submission_id_key").on(table.submissionId),
    uniqueIndex("applications_job_email_key").on(table.jobId, table.emailNormalized),
    uniqueIndex("applications_job_phone_key").on(table.jobId, table.phoneNormalized),
    index("applications_job_status_created_at_idx").on(table.jobId, table.status, table.createdAt),
    check("applications_status_check", sql`${table.status} in ('new', 'shortlisted', 'interview', 'hired', 'rejected')`),
    check("applications_resume_size_check", sql`${table.resumeSize} > 0`),
  ],
);

export const applicationEducations = recruitmentSchema.table(
  "application_educations",
  {
    ...baseColumns,
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id),
    position: integer("position").notNull(),
    degree: text("degree").notNull(),
    fieldOfStudy: text("field_of_study").notNull(),
    institution: text("institution").notNull(),
    completedOn: date("completed_on", { mode: "string" }),
    ongoing: boolean("ongoing").notNull().default(false),
    grade: text("grade"),
  },
  (table) => [
    index("application_educations_application_id_idx").on(table.applicationId, table.position),
    check("application_educations_done_or_ongoing_check", sql`(${table.completedOn} is not null) <> ${table.ongoing}`),
  ],
);

export const applicationExperiences = recruitmentSchema.table(
  "application_experiences",
  {
    ...baseColumns,
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id),
    position: integer("position").notNull(),
    company: text("company").notNull(),
    title: text("title").notNull(),
    fromOn: date("from_on", { mode: "string" }).notNull(),
    toOn: date("to_on", { mode: "string" }),
    current: boolean("current").notNull().default(false),
    responsibilities: text("responsibilities").notNull(),
  },
  (table) => [
    index("application_experiences_application_id_idx").on(table.applicationId, table.position),
    check("application_experiences_end_or_current_check", sql`(${table.toOn} is not null) <> ${table.current}`),
    check("application_experiences_range_check", sql`${table.toOn} is null or ${table.toOn} >= ${table.fromOn}`),
  ],
);

/** An answer keeps a copy of the question as it was when answered, so editing or archiving the question never rewrites history. */
export const applicationAnswers = recruitmentSchema.table(
  "application_answers",
  {
    ...baseColumns,
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id),
    questionId: uuid("question_id")
      .notNull()
      .references(() => jobQuestions.id),
    position: integer("position").notNull(),
    questionText: text("question_text").notNull(),
    answer: text("answer").notNull(),
  },
  (table) => [
    uniqueIndex("application_answers_application_question_key").on(table.applicationId, table.questionId),
    index("application_answers_application_id_idx").on(table.applicationId, table.position),
  ],
);
