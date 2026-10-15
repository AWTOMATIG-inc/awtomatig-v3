"use client";

import { useEffect, useRef, type ReactNode } from "react";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Drives the sticky stack of `[data-stack-card]` children (styles in services.css):
 * --stack-top    pins a card once its bottom reaches the viewport bottom, so cards taller than the screen are read in full
 * --stack-progress  0 → 1 as the next card slides over this one; scales and dims it
 * Every card, the last one included, holds full screen for --stack-hold of scroll (services.css).
 */
type StackingCardsProps = {
  children: ReactNode;
  /** Adds the closing hold spacer after the last card (services). Off when a `[data-stack-cover]` follows. */
  hold?: boolean;
  /** Hides a card once the next element fully covers it, so it can't show beside a scaled cover (How we work) */
  hideCovered?: boolean;
};

/**
 * Besides cards, a `[data-stack-cover]` child can close the stack: it isn't sticky or scaled itself, it only slides
 * over the card before it (How we work covering Operations).
 */
export default function StackingCards({ children, hold = true, hideCovered = false }: StackingCardsProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-stack-card], [data-stack-cover]"));
    const cards = items.filter((item) => item.hasAttribute("data-stack-card"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      cards.forEach((card) => {
        const next = items[items.indexOf(card) + 1];
        const top = next ? next.getBoundingClientRect().top : viewport;
        const progress = next && !reducedMotion.matches ? clamp01((viewport - top) / viewport) : 0;
        card.style.setProperty("--stack-progress", progress.toFixed(4));
        if (hideCovered) card.style.visibility = next && top <= 0 ? "hidden" : "";
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
  }, [hideCovered]);

  return (
    <div ref={ref} className="service-stack">
      {children}
      {hold && <div aria-hidden="true" className="service-stack-hold" />}
    </div>
  );
}
