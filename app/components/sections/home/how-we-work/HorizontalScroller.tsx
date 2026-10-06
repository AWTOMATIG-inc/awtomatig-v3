"use client";

import { useEffect, useRef, type FocusEvent, type MouseEvent, type ReactNode } from "react";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Scroll budget in screens: each slide holds for HOLD once it is fully in (the first and last too),
// and moving to the next slide takes MOVE. The pattern is hold, move, hold, …, move, hold.
const HOLD = 0.5;
const MOVE = 1;
const CYCLE = MOVE + HOLD;
const screensFor = (count: number) => (count - 1) * MOVE + count * HOLD;

/** Slide position (0 → count - 1) for a scroll offset measured in screens */
function slideAt(screens: number, count: number) {
  const t = screens - HOLD;
  if (t <= 0) return 0;
  const done = Math.floor(t / CYCLE);
  return Math.min(count - 1, done + Math.min(1, (t - done * CYCLE) / MOVE));
}

type HorizontalScrollerProps = {
  id: string;
  /** Number of slides; each one gets a screen of movement plus a HOLD pause */
  count: number;
  label: string;
  /** Visually hidden heading that keeps the heading order for the slides' h3s */
  heading: string;
  children: ReactNode;
};

/**
 * Turns vertical scrolling into a horizontal slide: a sticky full-screen viewport pins inside a tall section, and
 * the track of slides moves left by exactly the distance scrolled (--hww-progress, 0 → 1), pausing on every slide
 * for HOLD screens of scrolling once it is fully in view.
 * The progress eases towards the real scroll position so wheel notches glide instead of jumping; reduced motion
 * follows the scroll position directly. The step dots (`[data-step]`) and keyboard focus scroll to a slide.
 */
export default function HorizontalScroller({ id, count, label, heading, children }: HorizontalScrollerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let target = 0;
    let frame = 0;

    const readTarget = () => {
      const distance = section.offsetHeight - sticky.offsetHeight;
      if (distance <= 0 || count < 2) return void (target = 0);
      const screens = (clamp01(-section.getBoundingClientRect().top / distance) * screensFor(count));
      target = slideAt(screens, count) / (count - 1);
    };
    const paint = () => section.style.setProperty("--hww-progress", progressRef.current.toFixed(5));

    const tick = () => {
      frame = 0;
      const current = progressRef.current;
      const next = reducedMotion.matches || Math.abs(target - current) < 0.0004 ? target : current + (target - current) * 0.14;
      progressRef.current = next;
      paint();
      if (next !== target) frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      readTarget();
      if (!frame) frame = requestAnimationFrame(tick);
    };

    readTarget();
    progressRef.current = target;
    paint();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [count]);

  const scrollToSlide = (index: number, behavior: ScrollBehavior) => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;
    const distance = section.offsetHeight - sticky.offsetHeight;
    // Lands in the middle of the slide's pause
    const screens = index * CYCLE + HOLD / 2;
    const top = window.scrollY + section.getBoundingClientRect().top + (distance * screens) / screensFor(count);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduced ? "auto" : behavior });
  };

  const onClick = (event: MouseEvent<HTMLElement>) => {
    const button = (event.target as Element).closest<HTMLElement>("[data-step]");
    if (button) scrollToSlide(Number(button.dataset.step), "smooth");
  };

  // Tabbing into a slide that is off screen brings it into view
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    const slide = (event.target as Element).closest<HTMLElement>("[data-slide]");
    if (!slide) return;
    const index = Number(slide.dataset.slide);
    if (index !== Math.round(progressRef.current * (count - 1))) scrollToSlide(index, "auto");
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={label}
      style={{ height: `${(1 + screensFor(count)) * 100}svh` }}
      className="relative"
      onClick={onClick}
      onFocus={onFocus}
    >
      <h2 className="sr-only">{heading}</h2>
      <div ref={stickyRef} className="sticky top-0 h-svh overflow-clip">
        <div
          className="flex h-full will-change-transform"
          style={{
            width: `${count * 100}%`,
            transform: `translate3d(calc(var(--hww-progress, 0) * ${(-(count - 1) / count) * 100}%), 0, 0)`,
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
