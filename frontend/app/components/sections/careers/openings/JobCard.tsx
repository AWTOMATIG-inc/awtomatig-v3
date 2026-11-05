import { Button } from "@/app/components/ui";
import { ArrowRightIcon } from "@/app/components/icons";
import type { JobSummary } from "@/lib/careers";
import { JOB_TYPE_LABEL, WORK_MODE_LABEL, formatDate, formatSalary } from "../careers";

/** The small rounded tag used for job type, work mode and location. */
export function JobTag({ children }: { children: string }) {
  return <li className="type-body-14 bg-surface-subtle rounded-60 px-12 py-6">{children}</li>;
}

export default function JobCard({ job }: { job: JobSummary }) {
  return (
    <li className="rounded-16 bg-surface flex flex-col gap-24 p-20 lg:flex-row lg:items-center lg:justify-between lg:gap-40 lg:p-28">
      <div className="min-w-0 lg:flex-1">
        <h3 className="type-heading-28">{job.title}</h3>
        <ul className="mt-16 flex flex-wrap gap-8" aria-label="Job summary">
          <JobTag>{JOB_TYPE_LABEL[job.jobType]}</JobTag>
          <JobTag>{WORK_MODE_LABEL[job.workMode]}</JobTag>
          <JobTag>{job.location}</JobTag>
        </ul>
      </div>

      <dl className="grid shrink-0 grid-cols-2 gap-x-32 gap-y-4 lg:w-380">
        <div>
          <dt className="type-caption-12 text-fg-muted uppercase">Salary</dt>
          <dd className="type-body-16 mt-4 font-medium">{formatSalary(job)}</dd>
        </div>
        <div>
          <dt className="type-caption-12 text-fg-muted uppercase">Apply by</dt>
          <dd className="type-body-16 mt-4 font-medium">{formatDate(job.deadlineOn)}</dd>
        </div>
      </dl>

      <Button
        href={`/careers/${job.slug}`}
        variant="dark"
        size="card"
        iconEnd={<ArrowRightIcon />}
        aria-label={`View and apply: ${job.title}`}
        className="lg:shrink-0"
      >
        View and apply
      </Button>
    </li>
  );
}
