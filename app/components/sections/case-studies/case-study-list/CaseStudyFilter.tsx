"use client";

import { useState } from "react";
import { CASE_STUDIES, CASE_STUDY_CATEGORIES, type CaseStudyCategory } from "../../shared/case-studies/caseStudies";
import CaseStudyRow from "./CaseStudyRow";

type Filter = "All" | CaseStudyCategory;

const FILTERS: Filter[] = ["All", ...CASE_STUDY_CATEGORIES];

// Toggle buttons (one pressed at a time) above the list; the list re-renders in place
export default function CaseStudyFilter() {
  const [filter, setFilter] = useState<Filter>("All");
  const studies = filter === "All" ? CASE_STUDIES : CASE_STUDIES.filter((study) => study.category === filter);

  return (
    <>
      <div role="group" aria-label="Filter case studies by service" className="grid grid-cols-2 gap-10 lg:grid-cols-5">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === filter}
            onClick={() => setFilter(item)}
            className="type-body-14 h-56 rounded-8 bg-surface px-12 text-fg-strong transition-colors duration-200 not-aria-pressed:hover:bg-action-primary/20 aria-pressed:bg-action-primary aria-pressed:font-medium aria-pressed:text-on-action motion-reduce:transition-none max-lg:first:col-span-2"
          >
            {item}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {studies.length > 0 ? (
          <ul>
            {studies.map((study) => (
              <li key={study.id} className="py-60 not-last:border-b not-last:border-border lg:py-120">
                <CaseStudyRow study={study} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="type-body-16 py-60 text-center text-fg-muted lg:py-120">
            No {filter} case studies yet. Start a conversation to talk about yours.
          </p>
        )}
      </div>
    </>
  );
}
