"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger in ms, so a title and its description arrive one after the other */
  delay?: number;
  className?: string;
};

/**
 * Fades and rises into place the first time it scrolls into view. Reduced motion shows it at once (no transform, no
 * transition). Pass `className` for layout only.
 */
export default function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown || undefined}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      className={`ease-out-quint motion-safe:translate-y-24 motion-safe:opacity-0 motion-safe:transition-[opacity,translate] motion-safe:delay-(--reveal-delay) motion-safe:duration-2500 motion-safe:data-shown:translate-y-0 motion-safe:data-shown:opacity-100 ${className}`}
    >
      {children}
    </div>
  );
}
