"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Marks a card illustration as shown the first time it scrolls into view; the mockups animate from `group-data-shown:`. */
export default function MockupStage({ children, className }: { children: ReactNode; className?: string }) {
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
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-shown={shown || undefined} className={`group ${className ?? ""}`}>
      {children}
    </div>
  );
}
