"use client";

import { useEffect, useRef, type ReactNode } from "react";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Drives the sticky stack of `[data-stack-card]` children (styles in services.css):
 * --stack-top    pins a card once its bottom reaches the viewport bottom, so cards taller than the screen are read in full
 * --stack-progress  0 → 1 as the next card slides over this one; scales and dims it
 */
export default function StackingCards({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-stack-card]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        const progress =
          next && !reducedMotion.matches ? clamp01((viewport - next.getBoundingClientRect().top) / viewport) : 0;
        card.style.setProperty("--stack-progress", progress.toFixed(4));
      });
    };

    const measure = () => {
      const viewport = window.innerHeight;
      for (const card of cards) {
        card.style.setProperty("--stack-top", `${Math.min(0, viewport - card.offsetHeight)}px`);
      }
      update();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const resizeObserver = new ResizeObserver(measure);
    cards.forEach((card) => resizeObserver.observe(card));
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", schedule, { passive: true });
    reducedMotion.addEventListener("change", update);
    measure();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", schedule);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
