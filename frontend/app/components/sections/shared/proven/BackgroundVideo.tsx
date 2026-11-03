"use client";

import { useEffect, useRef } from "react";

// Full-bleed muted looping video behind a section. Under reduced motion it stays on its first frame instead of playing.
export default function BackgroundVideo({ src }: { src: string }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) video.current?.pause();
  }, []);

  return (
    <video
      ref={video}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none absolute inset-0 size-full object-cover"
    />
  );
}
