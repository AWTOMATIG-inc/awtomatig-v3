"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 3600;
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * A figure like "35+" that counts up from 0 the first time it scrolls into view. The final value is the server-rendered
 * text and what assistive tech reads; reduced motion (or no JS) just shows it.
 */
export default function CountUp({ value, className }: { value: string; className?: string }) {
  const [, prefix = "", digits = "", suffix = ""] = value.match(/^(\D*)(\d+)(\D*)$/) ?? [];
  const target = Number(digits);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!el || !digits || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    // Starts at 0 only once the script runs, so the text is complete without JS
    setShown(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          setShown(Math.round(target * easeOutExpo(t)));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [digits, target]);

  if (!digits) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="tabular-nums">
        {prefix}
        {shown}
        {suffix}
      </span>
    </span>
  );
}
