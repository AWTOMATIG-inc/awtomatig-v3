"use client";

import Image from "next/image";
import { useState } from "react";
import { CAPABILITIES } from "./capabilities";

// The eight areas as tabs beside their pictures: one is open at a time (the first at the start) and shows its description and
// its image, the rest are dimmed. Every description stays in the page HTML (a closed one is only collapsed and inert), and the
// images are stacked so the open one fades in over the others.
export default function CapabilityList() {
  const [open, setOpen] = useState(0);

  return (
    <div className="mt-40 grid gap-40 lg:mt-76 lg:grid-cols-[542fr_778fr] lg:gap-0">
      <ol>
        {CAPABILITIES.map(({ title, description }, i) => {
          const isOpen = open === i;
          const number = String(i + 1).padStart(2, "0");
          return (
            <li key={title}>
              <div className={`border-l-2 pl-32 ${isOpen ? "border-action-primary" : "border-transparent py-10"}`}>
                <h3 className="type-heading-24 tracking-tight">
                  <button
                    type="button"
                    id={`capability-tab-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`capability-panel-${i}`}
                    onClick={() => setOpen(i)}
                    className={`cursor-pointer text-left transition-colors duration-300 motion-reduce:transition-none ${isOpen ? "text-fg-inverse" : "text-white/40 hover:text-white/70"}`}
                  >
                    <span className="mr-10">{number}.</span>
                    {title}
                  </button>
                </h3>
                <div
                  id={`capability-panel-${i}`}
                  role="region"
                  aria-labelledby={`capability-tab-${i}`}
                  inert={!isOpen}
                  className={`ease-out-quint grid transition-[grid-template-rows,opacity] duration-500 motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="type-body-15 mt-6 max-w-420 text-white/80">{description}</p>
                  </div>
                </div>
              </div>
              {isOpen && <span aria-hidden="true" className="mt-24 mr-40 mb-6 ml-32 block h-px bg-white/12" />}
            </li>
          );
        })}
      </ol>

      <div className="rounded-20 relative aspect-4/3 w-full overflow-hidden">
        {CAPABILITIES.map(({ title, image, imageAlt }, i) => (
          <Image
            key={title}
            src={image}
            alt={open === i ? imageAlt : ""}
            fill
            sizes="(min-width: 1024px) 54vw, 100vw"
            aria-hidden={open !== i}
            className={`object-cover transition-opacity duration-500 motion-reduce:transition-none ${open === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
    </div>
  );
}
