import { Button } from "@/app/components/ui";
import type { JobsResult } from "@/lib/careers";
import { MAILTO, SITE } from "@/lib/site";
import Notice from "../Notice";
import JobCard from "./JobCard";

/** Careers page, after the hero: the open positions. A backend failure is a different message from "no vacancies", so an outage
 *  is never shown as an empty list. */
export default function OpeningsSection({ result }: { result: JobsResult }) {
  return (
    <section id="openings" aria-labelledby="openings-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-40 pb-60 lg:pb-100">
        <h2 id="openings-title" className="type-heading-40">
          Open positions
        </h2>

        <div className="mt-24 lg:mt-32">
          {!result.ok ? (
            <Notice title="We could not load the openings">
              <p>
                Something went wrong on our side. Please reload this page in a moment, or write to us at{" "}
                <a href={MAILTO} className="underline underline-offset-2">
                  {SITE.email}
                </a>
                .
              </p>
            </Notice>
          ) : result.jobs.length === 0 ? (
            <Notice
              title="Currently no vacancies"
              actions={
                <Button href="/contact" variant="dark" size="card">
                  Get in touch
                </Button>
              }
            >
              <p>
                We have no open positions right now. Check back soon, or send us a note at{" "}
                <a href={MAILTO} className="underline underline-offset-2">
                  {SITE.email}
                </a>{" "}
                and tell us what you do best.
              </p>
            </Notice>
          ) : (
            <ul className="grid gap-16">
              {result.jobs.map((job) => (
                <JobCard key={job.slug} job={job} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
