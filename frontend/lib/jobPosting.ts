import type { Job, JobType } from "./careers";
import { SITE } from "./site";

// schema.org JobPosting (Google for Jobs) for one open position. Pure: a job in, a plain object out.
//
// Left out on purpose: baseSalary. Google needs a pay period (hour, month, year) and the backend stores none, so including the
// amount would mean guessing. Add it once a period is stored on the job.

const EMPLOYMENT_TYPE: Record<JobType, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contractual: "CONTRACTOR",
};

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]\s+)/, "").trim())
    .filter(Boolean);

/** The description field is HTML in a JobPosting. Job text is plain, so paragraphs become <p> and one-per-line lists become <ul>. */
export function jobDescriptionHtml(job: Pick<Job, "description" | "requirements" | "benefits">): string {
  const paragraphs = job.description
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r?\n/g, "<br>")}</p>`);
  const list = (title: string, text: string) => {
    const items = lines(text);
    return items.length > 0
      ? [`<p><strong>${title}</strong></p>`, `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`]
      : [];
  };
  return [...paragraphs, ...list("Requirements", job.requirements), ...list("Benefits", job.benefits)].join("");
}

/** The posting for an open job, or null when it no longer takes applications (Google asks for expired postings to be removed). */
export function buildJobPosting(job: Job): Record<string, unknown> | null {
  if (!job.acceptingApplications) return null;
  const country = { "@type": "Country", name: SITE.address.country };

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: jobDescriptionHtml(job),
    identifier: { "@type": "PropertyValue", name: SITE.name, value: job.slug },
    ...(job.publishedAt && { datePosted: job.publishedAt.slice(0, 10) }),
    // The deadline is a calendar day, valid through its end in Dhaka (UTC+6)
    validThrough: `${job.deadlineOn}T23:59:59+06:00`,
    employmentType: EMPLOYMENT_TYPE[job.jobType],
    totalJobOpenings: job.vacancies,
    hiringOrganization: { "@type": "Organization", name: SITE.name, sameAs: SITE.url },
    // A fully remote job has no place; Google wants the countries it can be done from instead
    ...(job.workMode === "remote"
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: country }
      : {
          jobLocation: {
            "@type": "Place",
            address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: SITE.address.country },
          },
        }),
    directApply: true,
    url: new URL(`/careers/${job.slug}`, SITE.url).toString(),
  };
}
