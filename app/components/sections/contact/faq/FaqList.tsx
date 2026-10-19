"use client";

import { useState } from "react";
import { FAQS } from "./faq";

// One question open at a time; the answer grows from 0 to its height (grid rows), so it needs no measuring
export default function FaqList() {
  const [open, setOpen] = useState(0);

  return (
    <ul className="border-border border-t">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={item.question} className="border-border border-b last:border-b-0">
            <h3>
              <button
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="group type-heading-24 flex min-h-44 w-full cursor-pointer items-center justify-between gap-20 py-26 text-left"
              >
                {item.question}
                <span
                  aria-hidden="true"
                  className="rounded-6 relative size-32 shrink-0 bg-black/12 transition-colors duration-300 group-hover:bg-black/20"
                >
                  <span className="absolute top-1/2 left-1/2 h-2 w-12 -translate-1/2 bg-current" />
                  <span
                    className={`ease-out-quint absolute top-1/2 left-1/2 h-12 w-2 -translate-1/2 bg-current transition-transform duration-500 motion-reduce:transition-none ${isOpen ? "scale-y-0" : ""}`}
                  />
                </span>
              </button>
            </h3>
            <div
              id={`faq-a-${i}`}
              role="region"
              aria-labelledby={`faq-q-${i}`}
              inert={!isOpen}
              className={`ease-out-quint grid transition-[grid-template-rows,opacity] duration-500 motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <p className="type-body-15 text-fg-muted max-w-860 pb-26">{item.answer}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
