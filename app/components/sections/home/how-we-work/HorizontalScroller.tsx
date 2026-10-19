"use client";

import { useEffect, useRef, type FocusEvent, type MouseEvent, type ReactNode } from "react";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// Scroll budget in screens: each slide holds for HOLD once it is fully in (the first and last too),
// and moving to the next slide takes MOVE. The pattern is hold, move, hold, …, move, hold.
const HOLD = 0.5;
const MOVE = 1;
const CYCLE = MOVE + HOLD;
const screensFor = (count: number) => (count - 1) * MOVE + count * HOLD;
// After the last slide the pinned viewport stays for one more screen while the next section slides over it
const EXIT = 1;

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
      const rect = section.getBoundingClientRect();
      const screen = sticky.offsetHeight;
      // 0 → 1 while the next section covers the last slide: the slide shrinks, rounds and dims like a stacking card
      const exit = reducedMotion.matches ? 0 : clamp01((screen * 2 - rect.bottom) / screen);
      section.style.setProperty("--hww-exit", exit.toFixed(4));
      if (screen <= 0 || count < 2) return void (target = 0);
      const screens = Math.min(screensFor(count), Math.max(0, -rect.top / screen));
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

    // Pointer / touch: the fluted bars shift sideways towards the pointer (--ribs-pointer, -1 → 1), eased like the hero lines
    let pointerTarget = 0;
    let pointerNow = 0;
    let pointerFrame = 0;
    const pointerTick = () => {
      pointerFrame = 0;
      pointerNow += (pointerTarget - pointerNow) * 0.07;
      if (Math.abs(pointerTarget - pointerNow) < 0.001) pointerNow = pointerTarget;
      section.style.setProperty("--ribs-pointer", pointerNow.toFixed(4));
      if (pointerNow !== pointerTarget) pointerFrame = requestAnimationFrame(pointerTick);
    };
    const onPointer = (event: PointerEvent) => {
      if (reducedMotion.matches) return;
      const rect = sticky.getBoundingClientRect();
      pointerTarget = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      if (!pointerFrame) pointerFrame = requestAnimationFrame(pointerTick);
    };
    const onPointerEnd = () => {
      pointerTarget = 0;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(pointerTick);
    };
    sticky.addEventListener("pointermove", onPointer);
    sticky.addEventListener("pointerdown", onPointer);
    sticky.addEventListener("pointerleave", onPointerEnd);
    sticky.addEventListener("pointercancel", onPointerEnd);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pointerFrame);
      sticky.removeEventListener("pointermove", onPointer);
      sticky.removeEventListener("pointerdown", onPointer);
      sticky.removeEventListener("pointerleave", onPointerEnd);
      sticky.removeEventListener("pointercancel", onPointerEnd);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [count]);

  const scrollToSlide = (index: number, behavior: ScrollBehavior) => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;
    // Lands in the middle of the slide's pause
    const screens = index * CYCLE + HOLD / 2;
    const top = window.scrollY + section.getBoundingClientRect().top + sticky.offsetHeight * screens;
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
      data-stack-cover
      style={{ height: `${(1 + screensFor(count) + EXIT) * 100}svh`, marginBottom: `${-EXIT * 100}svh` }}
      className="relative"
      onClick={onClick}
      onFocus={onFocus}
    >
      <h2 className="sr-only">{heading}</h2>
      <div
        ref={stickyRef}
        className="sticky top-0 h-svh origin-top overflow-clip will-change-transform"
        style={{
          transform: "scale(calc(1 - var(--hww-exit, 0) * 0.06))",
          borderRadius: "calc(var(--hww-exit, 0) * var(--radius-34))",
        }}
      >
        <div
          className="flex h-full will-change-transform"
          style={{
            width: `${count * 100}%`,
            transform: `translate3d(calc(var(--hww-progress, 0) * ${(-(count - 1) / count) * 100}%), 0, 0)`,
          }}
        >
          {children}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: "calc(var(--hww-exit, 0) * 0.4)" }}
        />
      </div>
    </section>
  );
}
