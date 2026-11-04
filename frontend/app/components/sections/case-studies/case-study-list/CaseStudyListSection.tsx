import { getCaseStudies } from "@/lib/caseStudies";
import CaseStudyFilter from "./CaseStudyFilter";

// Case Studies page: service filter tabs and every published case study as a card that stacks over the previous one on scroll
export default async function CaseStudyListSection() {
  const result = await getCaseStudies();

  return (
    <section aria-label="Case studies" className="bg-surface-subtle text-fg-strong">
      <CaseStudyFilter studies={result.ok ? result.studies : []} />
    </section>
  );
}
