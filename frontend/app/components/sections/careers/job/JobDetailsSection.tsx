import Link from "next/link";
import type { ReactNode } from "react";
import { Button, Eyebrow } from "@/app/components/ui";
import { ChevronRightIcon } from "@/app/components/icons";
import type { Job } from "@/lib/careers";
import { JOB_TYPE_LABEL, WORK_MODE_LABEL, formatDate, formatSalary, toLines, toParagraphs } from "../careers";
import { JobTag } from "../openings/JobCard";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-border border-t pt-28">
      <h2 className="type-heading-28">{title}</h2>
      <div className="mt-16">{children}</div>
    </div>
  );
}

function Bullets({ text }: { text: string }) {
  return (
    <ul className="type-body-16 text-fg-primary grid gap-10">
      {toLines(text).map((line, i) => (
        <li key={i} className="flex gap-12">
          <span aria-hidden="true" className="bg-charcoal mt-10 size-6 shrink-0 rounded-full" />
          <span className="min-w-0">{line}</span>
        </li>
      ))}
    </ul>
  );
}

/** A job's page, under the light navbar: the title and tags, the description / requirements / benefits, and a summary card with
 *  the Apply button (or a note when the job no longer takes applications). */
export default function JobDetailsSection({ job }: { job: Job }) {
  const summary: [string, string][] = [
    ["Job type", JOB_TYPE_LABEL[job.jobType]],
    ["Work mode", WORK_MODE_LABEL[job.workMode]],
    ["Location", job.location],
    ["Salary", formatSalary(job)],
    ["Vacancies", String(job.vacancies)],
    ["Office timing", job.officeTiming],
    ["Apply by", formatDate(job.deadlineOn)],
  ];

  return (
    <section aria-labelledby="job-title" className="bg-surface-subtle text-fg-strong">
      {/* Top padding clears the fixed navbar (pill bottom ≈ 64px on mobile, ≈ 80px on desktop) */}
      <div className="site-container pt-safe-120 lg:pt-safe-160 pb-60 lg:pb-100">
        <Link
          href="/careers"
          className="type-label-14 hover:text-fg-strong/60 inline-flex items-center gap-8 uppercase transition-colors duration-200 motion-reduce:transition-none"
        >
          <ChevronRightIcon aria-hidden="true" className="size-14 rotate-180" />
          All openings
        </Link>

        <div className="mt-24 max-w-880">
          <Eyebrow>Careers</Eyebrow>
          <h1 id="job-title" className="type-heading-60 mt-20">
            {job.title}
          </h1>
          <ul className="mt-20 flex flex-wrap gap-8" aria-label="Job summary">
            <JobTag>{JOB_TYPE_LABEL[job.jobType]}</JobTag>
            <JobTag>{WORK_MODE_LABEL[job.workMode]}</JobTag>
            <JobTag>{job.location}</JobTag>
          </ul>
        </div>

        <div className="mt-40 grid gap-40 lg:mt-60 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-60">
          <div className="grid min-w-0 gap-28">
            {toParagraphs(job.description).length > 0 && (
              <Block title="About the role">
                <div className="type-body-16 text-fg-primary grid gap-16">
                  {toParagraphs(job.description).map((paragraph, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Block>
            )}
            {toLines(job.requirements).length > 0 && (
              <Block title="Requirements">
                <Bullets text={job.requirements} />
              </Block>
            )}
            {toLines(job.benefits).length > 0 && (
              <Block title="Benefits">
                <Bullets text={job.benefits} />
              </Block>
            )}
          </div>

          <aside aria-label="Job details" className="lg:sticky lg:top-120 lg:self-start">
            <div className="rounded-16 bg-surface p-20 lg:p-28">
              <dl className="grid gap-16">
                {summary.map(([label, value]) => (
                  <div key={label}>
                    <dt className="type-caption-12 text-fg-muted uppercase">{label}</dt>
                    <dd className="type-body-16 mt-4 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              {job.acceptingApplications ? (
                <Button href="#apply" variant="primary" size="lg" fullWidth className="mt-28">
                  Apply now
                </Button>
              ) : (
                <>
                  <p className="type-body-14 text-fg-primary border-border mt-28 border-t pt-20">
                    This position is no longer accepting applications.
                  </p>
                  <Button href="/careers" variant="dark" size="lg" fullWidth className="mt-20">
                    See other openings
                  </Button>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
