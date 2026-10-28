"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// The longest mockup (Disconnected systems) takes about 4s to finish, then the card rests before replaying
const ANIMATE_MS = 4000;
const REST_MS = 4000;
// Time spent in the reset state so the mockups snap back to their start without playing in reverse
const RESET_MS = 80;

/**
 * Marks a card illustration as shown while it is on screen; the mockups animate from `group-data-shown:`.
 * It plays once, rests for a few seconds, snaps back and plays again. Reduced motion shows the static end state.
 */
export default function MockupStage({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const play = () => {
      setResetting(false);
      setShown(true);
      if (!reduceMotion) timer = setTimeout(reset, ANIMATE_MS + REST_MS);
    };
    const reset = () => {
      setResetting(true);
      setShown(false);
      timer = setTimeout(play, RESET_MS);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        clearTimeout(timer);
        if (entry.isIntersecting) play();
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown || undefined}
      className={`group ${resetting ? "[&_*]:transition-none!" : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
