import CaseStudyFilter from "./CaseStudyFilter";

// Case Studies page: service filter tabs and every case study, split by hairlines
export default function CaseStudyListSection() {
  return (
    <section aria-label="Case studies" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-20 lg:pt-54">
        <CaseStudyFilter />
      </div>
    </section>
  );
}
