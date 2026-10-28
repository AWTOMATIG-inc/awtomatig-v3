import CaseStudyFilter from "./CaseStudyFilter";

// Case Studies page: service filter tabs and every case study as a card that stacks over the previous one on scroll
export default function CaseStudyListSection() {
  return (
    <section aria-label="Case studies" className="bg-surface-subtle text-fg-strong">
      <CaseStudyFilter />
    </section>
  );
}
