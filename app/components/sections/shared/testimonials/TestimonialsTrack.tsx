"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { PauseIcon, PlayIcon } from "@/app/components/icons";
import { getService, type ServiceId } from "@/lib/services";
import type { Testimonial } from "./testimonials";

// Chip background per service; everything else falls back to the neutral off-white chip
const TAG_THEMES: Partial<Record<ServiceId, string>> = {
  "back-office-operations": "bg-action-primary text-on-action",
};
const TAG_DEFAULT = "bg-surface-subtle text-fg-strong";

const AUTOPLAY_SPEED = 0.065; // px per ms (~27px/600ms, an ambient drift, not a slide)
const INTERACTION_COOLDOWN = 700; // ms before autoplay resumes after a wheel nudge

// Scrollable testimonial cards: native touch scroll, click-and-drag with a mouse, continuous autoplay that
// pauses on any interaction and is otherwise toggled by the scrub bar's play/pause handle (DESIGN.md pattern:
// a draggable progress scrubber, like MarqueeTrack's pause toggle but also seekable).
export default function TestimonialsTrack({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const draggingTrack = useRef(false);
  const draggingScrub = useRef(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });
  const moved = useRef(false);
  const rafRef = useRef<number | null>(null);
  const wheelTimeout = useRef<number | null>(null);
  const interacting = useRef(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const updateProgress = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
    return () => el.removeEventListener("scroll", updateProgress);
  }, [updateProgress]);

  useEffect(() => {
    if (!playing || reducedMotion.current) return;
    let last = performance.now();
    function step(now: number) {
      const el = trackRef.current;
      if (el && !draggingTrack.current && !draggingScrub.current && !interacting.current) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) {
          const next = el.scrollLeft + (now - last) * AUTOPLAY_SPEED;
          el.scrollLeft = next >= max ? 0 : next;
        }
      }
      last = now;
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  function markInteraction() {
    interacting.current = true;
    if (wheelTimeout.current) window.clearTimeout(wheelTimeout.current);
    wheelTimeout.current = window.setTimeout(() => {
      interacting.current = false;
    }, INTERACTION_COOLDOWN);
  }

  function onTrackPointerDown(e: PointerEvent<HTMLUListElement>) {
    if (e.pointerType === "touch") return; // touch keeps native scrolling
    const el = trackRef.current;
    if (!el) return;
    draggingTrack.current = true;
    moved.current = false;
    dragStart.current = { x: e.clientX, scrollLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  }
  function onTrackPointerMove(e: PointerEvent<HTMLUListElement>) {
    if (!draggingTrack.current) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 3) moved.current = true;
    el.scrollLeft = dragStart.current.scrollLeft - dx;
  }
  function endTrackDrag(e: PointerEvent<HTMLUListElement>) {
    draggingTrack.current = false;
    trackRef.current?.releasePointerCapture(e.pointerId);
  }
  function onWheel(e: WheelEvent<HTMLUListElement>) {
    const el = trackRef.current;
    if (!el || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    el.scrollLeft += e.deltaY;
    markInteraction();
  }

  function setFromClientX(clientX: number) {
    const track = trackRef.current;
    const scrub = scrubRef.current;
    if (!track || !scrub) return;
    const rect = scrub.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const max = track.scrollWidth - track.clientWidth;
    track.scrollLeft = ratio * max;
  }
  function onScrubPointerDown(e: PointerEvent<HTMLDivElement>) {
    draggingScrub.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromClientX(e.clientX);
  }
  function onScrubPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingScrub.current) return;
    setFromClientX(e.clientX);
  }
  function endScrubDrag(e: PointerEvent<HTMLDivElement>) {
    draggingScrub.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div className="mt-40 lg:mt-60">
      <ul
        ref={trackRef}
        role="region"
        aria-label="Client testimonials"
        tabIndex={0}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={endTrackDrag}
        onPointerCancel={endTrackDrag}
        onWheel={onWheel}
        className="scrollbar-hide flex cursor-grab touch-pan-x gap-20 overflow-x-auto pb-4 select-none active:cursor-grabbing"
      >
        {testimonials.map((testimonial) => (
          <li
            key={testimonial.id}
            className="bg-surface rounded-16 flex w-290 shrink-0 flex-col p-24 sm:w-360 sm:p-28 lg:w-404 lg:p-32"
          >
            <span
              className={`type-caption-12 rounded-8 inline-block self-start px-12 py-6 font-medium uppercase ${
                TAG_THEMES[testimonial.service] ?? TAG_DEFAULT
              }`}
            >
              {getService(testimonial.service).name}
            </span>

            <p className="type-body-20 text-fg-strong mt-20 lg:mt-28">&ldquo;{testimonial.quote}&rdquo;</p>

            <div className="mt-auto pt-28 lg:pt-40">
              <Image
                src={testimonial.logo}
                alt={testimonial.company}
                className={`h-36 w-auto max-w-160 object-contain object-left ${testimonial.logoOnWhite ? "opacity-80 brightness-0" : ""}`}
              />
              <p className="type-body-16 text-fg-strong mt-16 font-medium">{testimonial.name}</p>
              <p className="type-body-14 text-fg-muted">
                {testimonial.role} · {testimonial.company}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-32 lg:mt-50">
        <div
          ref={scrubRef}
          onPointerDown={onScrubPointerDown}
          onPointerMove={onScrubPointerMove}
          onPointerUp={endScrubDrag}
          onPointerCancel={endScrubDrag}
          className="bg-border relative h-4 cursor-pointer rounded-full"
        >
          <div
            aria-hidden="true"
            className="bg-action-primary absolute inset-y-0 left-0 rounded-full"
            style={{ width: `calc(${progress} * (100% - 32px) + 16px)` }}
          />
          <button
            type="button"
            aria-pressed={!playing}
            aria-label={playing ? "Pause testimonials autoplay" : "Play testimonials autoplay"}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setPlaying((p) => !p)}
            className="bg-action-primary text-on-action shadow-glow absolute top-1/2 flex h-22 w-32 -translate-y-1/2 items-center justify-center rounded-full"
            style={{ left: `calc(${progress} * (100% - 32px))` }}
          >
            {playing ? <PauseIcon className="size-14" /> : <PlayIcon className="size-14" />}
          </button>
        </div>
      </div>
    </div>
  );
}
