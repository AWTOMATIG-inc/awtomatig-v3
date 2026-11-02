import { Eyebrow } from "@/app/components/ui";
import type { Job } from "@/lib/careers";
import ApplicationForm from "./ApplicationForm";

/** A job's page, after the details: the application form, only while the job accepts applications. Same two-column rhythm as the
 *  Contact page's inquiry section. */
export default function ApplySection({ job }: { job: Job }) {
  if (!job.acceptingApplications) return null;

  return (
    <section id="apply" aria-labelledby="apply-title" className="bg-surface-subtle text-fg-strong scroll-mt-80">
      <div className="site-container grid gap-40 pb-60 lg:grid-cols-[minmax(0,1fr)_739px] lg:gap-50 lg:pb-100">
        <div className="lg:pt-8">
          <Eyebrow>Apply</Eyebrow>
          <h2 id="apply-title" className="type-heading-60 mt-24">
            Send your
            <br className="max-lg:hidden" /> application.
          </h2>
          <p className="type-body-16-compact text-fg-primary mt-20 max-w-540 lg:mt-26">
            Tell us about your education and experience, answer the questions for this role and attach your resume as a PDF. It
            takes about ten minutes. We will email you a confirmation when it arrives.
          </p>
        </div>

        <ApplicationForm job={job} />
      </div>
    </section>
  );
}
