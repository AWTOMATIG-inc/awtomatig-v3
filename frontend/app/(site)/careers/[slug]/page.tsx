import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ApplySection from "@/app/components/sections/careers/apply/ApplySection";
import JobDetailsSection from "@/app/components/sections/careers/job/JobDetailsSection";
import { JOB_TYPE_LABEL, WORK_MODE_LABEL } from "@/app/components/sections/careers/careers";
import Notice from "@/app/components/sections/careers/Notice";
import JobPostingJsonLd from "@/app/components/seo/JobPostingJsonLd";
import { Button } from "@/app/components/ui";
import { getJob } from "@/lib/careers";
import { pageMetadata } from "@/lib/metadata";
import { MAILTO, SITE } from "@/lib/site";

// Job pages are built on the first visit and then rebuilt in the background at most once a minute. None are known at build
// time, so a new opening needs no deploy. (The backend decides whether a job takes applications, so a closed job stops accepting
// at once even while its page is cached.)
export const revalidate = 30; // must be a literal; keep equal to CAREERS_REVALIDATE_SECONDS in lib/careers.ts

// Meta titles are up to 60 characters with " | AWTOMATIG" (12), descriptions up to 160; job text is free-form, so cut it to fit.
const fit = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`);

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/careers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await getJob(slug);
  if (found.status !== "ok") return {};
  const { job } = found;
  return {
    ...pageMetadata({
      title: fit(`${job.title} Job in ${job.location}`, 48),
      description: fit(
        `Apply for the ${job.title} position at AWTOMATIG. ${JOB_TYPE_LABEL[job.jobType]}, ${WORK_MODE_LABEL[job.workMode].toLowerCase()}, ${job.location}. See the requirements and benefits.`,
        160,
      ),
      path: `/careers/${job.slug}`,
    }),
    // A job that no longer takes applications stays readable but should not be offered by search engines
    ...(!job.acceptingApplications && { robots: { index: false, follow: true } }),
  };
}

export default async function JobPage({ params }: PageProps<"/careers/[slug]">) {
  const { slug } = await params;
  const found = await getJob(slug);
  if (found.status === "not-found") notFound();

  if (found.status === "error") {
    return (
      <section aria-labelledby="job-error-title" className="bg-surface-subtle text-fg-strong flex-1">
        <div className="site-container pt-safe-120 lg:pt-safe-160 pb-60 lg:pb-100">
          <Notice
            title="We could not load this position"
            actions={
              <Button href="/careers" variant="dark" size="card">
                All openings
              </Button>
            }
          >
            <p id="job-error-title">
              Something went wrong on our side. Please reload this page in a moment, or write to us at{" "}
              <a href={MAILTO} className="underline underline-offset-2">
                {SITE.email}
              </a>
              .
            </p>
          </Notice>
        </div>
      </section>
    );
  }

  return (
    <>
      <JobPostingJsonLd job={found.job} />
      <JobDetailsSection job={found.job} />
      <ApplySection job={found.job} />
    </>
  );
}
