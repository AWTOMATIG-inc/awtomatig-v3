"use client";

import { useState } from "react";
import { SERVICES, type ServiceId } from "@/lib/services";
import StackingCards from "../../home/services/StackingCards";
import { CASE_STUDIES } from "../../shared/case-studies/caseStudies";
import CaseStudyRow from "./CaseStudyRow";

type Filter = "all" | ServiceId;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  ...SERVICES.map((service) => ({ id: service.id, label: service.short })),
];

// Toggle buttons (one pressed at a time) above the list; the list re-renders in place
export default function CaseStudyFilter() {
  const [filter, setFilter] = useState<Filter>("all");
  const studies = filter === "all" ? CASE_STUDIES : CASE_STUDIES.filter((study) => study.category === filter);
  const filterLabel = FILTERS.find((item) => item.id === filter)?.label ?? filter;

  return (
    <>
      <div className="site-container pt-20 lg:pt-54">
        <div role="group" aria-label="Filter case studies by service" className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === filter}
              onClick={() => setFilter(item.id)}
              className="type-body-14 rounded-8 bg-surface text-fg-strong not-aria-pressed:hover:bg-action-primary/20 aria-pressed:bg-action-primary aria-pressed:text-on-action h-56 px-12 transition-colors duration-200 aria-pressed:font-medium motion-reduce:transition-none max-lg:first:col-span-2"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite">
        {studies.length > 0 ? (
          // Keyed by filter so the stack re-measures its cards when the list changes
          <StackingCards key={filter}>
            {studies.map((study) => (
              <div key={study.id} data-stack-card className="service-card bg-surface-subtle">
                <div className="site-container py-60 lg:py-120">
                  <CaseStudyRow study={study} />
                </div>
              </div>
            ))}
          </StackingCards>
        ) : (
          <p className="type-body-16 text-fg-muted site-container py-60 text-center lg:py-120">
            No {filterLabel} case studies yet. Start a conversation to talk about yours.
          </p>
        )}
      </div>
    </>
  );
}
