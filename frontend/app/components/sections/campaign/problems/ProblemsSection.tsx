import ProblemsBlock from "../../shared/problems/ProblemsBlock";

// Campaign page: "When things break down", the Home Operations problem cards (with their animations) as their own section
export default function ProblemsSection() {
  return (
    <section id="problems" aria-labelledby="problems-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container">
        <ProblemsBlock titleId="problems-title" paddingClassName="pt-60 lg:pt-120" />
      </div>
    </section>
  );
}
