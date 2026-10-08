"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** The step list with its vertical rail. The cyan part of the rail grows with the scroll: it reaches down to a reference
 *  line at mid-screen, and each `[data-step]` gets `data-reached` / `data-active` (read by its node) as the line passes it. */
export default function ProcessTimeline({ children }: { children: ReactNode }) {
  const list = useRef<HTMLOListElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ol = list.current;
    const bar = fill.current;
    if (!ol || !bar) return;
    const steps = Array.from(ol.querySelectorAll<HTMLElement>("[data-step]"));
    const nodes = steps.map((step) => step.querySelector<HTMLElement>("[data-node]")!);
    let frame = 0;

    const update = () => {
      frame = 0;
      const ref = window.innerHeight * 0.5;
      const first = nodes[0].getBoundingClientRect();
      const top = first.top + first.height / 2;
      const bottom = ol.getBoundingClientRect().bottom;
      bar.style.height = `${Math.max(0, Math.min(ref, bottom) - top)}px`;

      let active = 0;
      const reached = nodes.map((node, i) => {
        const r = node.getBoundingClientRect();
        const done = i === 0 || r.top + r.height / 2 <= ref;
        if (done) active = i;
        return done;
      });
      steps.forEach((step, i) => {
        step.toggleAttribute("data-reached", reached[i]);
        step.toggleAttribute("data-active", i === active);
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <ol ref={list} className="relative flex flex-col gap-50 pb-40 lg:gap-58 lg:pb-64">
      {/* Rail: starts at the first node's centre and runs to the bottom of the section; the grey rail and the cyan fill both end in a soft fade */}
      <span
        aria-hidden="true"
        className="fade-end absolute top-14 bottom-0 left-9.5 w-9 rounded-full bg-border [--fade-length:260px] lg:top-22 lg:left-15.5"
      >
        <span ref={fill} className="fade-end block w-full rounded-full bg-action-primary [--fade-length:240px]" />
      </span>
      {children}
    </ol>
  );
}
