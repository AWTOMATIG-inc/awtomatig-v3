import type { Job } from "@/lib/careers";
import { buildJobPosting } from "@/lib/jobPosting";

/** schema.org JobPosting for a job's page, only while the job takes applications. The `<` escape keeps job text from closing the tag. */
export default function JobPostingJsonLd({ job }: { job: Job }) {
  const posting = buildJobPosting(job);
  if (!posting) return null;
  const json = JSON.stringify(posting).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
