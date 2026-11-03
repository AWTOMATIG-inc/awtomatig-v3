"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { PlayIcon } from "@/app/components/icons";
import type { WorkStep } from "./workPath";

const INTERVAL = 4000;
// The last title overhangs the edge by a few px at 1440; only a real overflow counts as scrollable
const SCROLL_SLACK = 16;
// How far the cyan rail runs on and fades out beyond the active step (measured: about 190 design px)
const FADE = 190;
// Column ratios measured from the design (the columns hug their text there, so the pitch is uneven)
const COLUMNS = "grid-cols-[minmax(0,217fr)_minmax(0,216fr)_minmax(0,208fr)_minmax(0,220fr)_minmax(0,193fr)_minmax(0,265fr)]";

const NODES = {
  idle: "border-6 border-border bg-surface-subtle",
  reached: "border-6 border-action-primary bg-surface-subtle",
  active: "bg-action-primary/20",
};

/** The six-step timeline. The active step advances by itself every few seconds (paused while the pointer or focus is
 *  inside, for a while after a touch or wheel, off screen and under reduced motion); a click picks a step, and the row
 *  scrolls sideways by touch, wheel or mouse drag when it is wider than the screen. */
export default function WorkPathTimeline({ steps }: { steps: WorkStep[] }) {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [held, setHeld] = useState(false);
  const [visible, setVisible] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const holdTimer = useRef(0);
  const drag = useRef({ down: false, moved: false, x: 0, left: 0 });

  const paused = hovering || held;

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Autoplay: restarts on every change, so a click gives the chosen step a full interval
  useEffect(() => {
    if (paused || !visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((current) => (current + 1) % steps.length), INTERVAL);
    return () => window.clearInterval(id);
  }, [active, paused, visible, steps.length]);

  // The cyan rail runs from the first node to the active one and fades out beyond it; keep the active step in view
  useEffect(() => {
    const list = track.current;
    const bar = fill.current;
    const view = scroller.current;
    if (!list || !bar || !view) return;
    const items = Array.from(list.children) as HTMLElement[];
    const update = () => {
      bar.style.width = `${items[active].offsetLeft - items[0].offsetLeft + FADE}px`;
    };
    update();

    if (view.scrollWidth - view.clientWidth > SCROLL_SLACK && !drag.current.down) {
      const item = items[active];
      const left = item.offsetLeft - (view.clientWidth - item.offsetWidth) / 2;
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      view.scrollTo({ left: Math.max(0, left), behavior: calm ? "auto" : "smooth" });
    }

    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  // After a touch or wheel the visitor is in charge: hold the autoplay for a while
  const hold = () => {
    setHeld(true);
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setHeld(false), 8000);
  };

  const startDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    const view = scroller.current;
    if (!view || event.button !== 0 || view.scrollWidth - view.clientWidth <= SCROLL_SLACK) return;
    drag.current = { down: true, moved: false, x: event.clientX, left: view.scrollLeft };
    const move = (e: MouseEvent) => {
      const dx = e.clientX - drag.current.x;
      if (Math.abs(dx) > 5) drag.current.moved = true;
      view.scrollLeft = drag.current.left - dx;
    };
    const end = () => {
      drag.current.down = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
  };

  return (
    <div
      ref={scroller}
      className="scrollbar-hide -mr-8 overflow-x-auto overscroll-x-contain pr-8"
      onMouseDown={startDrag}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      onTouchStart={hold}
      onWheel={hold}
      // A drag that moved must not also pick the step it ended on
      onClickCapture={(event) => {
        if (drag.current.moved) {
          event.preventDefault();
          event.stopPropagation();
          drag.current.moved = false;
        }
      }}
    >
      <div className="relative min-w-1100">
        {/* Rail: from the first node's centre to the right edge, fading out; the cyan part follows the active step */}
        <span
          aria-hidden="true"
          className="fade-end-x bg-border absolute top-15.5 right-0 left-20 h-9 rounded-full [--fade-length:160px]"
        />
        <span
          ref={fill}
          aria-hidden="true"
          className="fade-end-x bg-action-primary ease-out-quint absolute top-15.5 left-20 h-9 rounded-full transition-[width] duration-700 [--fade-length:190px] motion-reduce:transition-none"
        />

        <ol ref={track} className={`relative grid ${COLUMNS}`}>
          {steps.map((step, i) => {
            const state = i === active ? "active" : i < active ? "reached" : "idle";
            const on = state === "active";
            return (
              <li key={step.title} className="pr-20">
                <button
                  type="button"
                  aria-current={on ? "step" : undefined}
                  onClick={() => setActive(i)}
                  className="block w-full cursor-pointer text-left"
                >
                  <span
                    className={`relative z-10 grid size-40 place-items-center rounded-full transition-colors duration-300 motion-reduce:transition-none ${NODES[state]}`}
                  >
                    {on && (
                      <span className="bg-action-primary grid size-28 place-items-center rounded-full">
                        <PlayIcon className="size-12 text-white" />
                      </span>
                    )}
                  </span>
                  <span
                    className={`type-heading-28 mt-40 block tracking-tight whitespace-nowrap transition-colors duration-300 motion-reduce:transition-none ${on ? "text-fg-strong" : "text-black/60"}`}
                  >
                    {step.title}
                  </span>
                  <span
                    className={`type-body-16-compact mt-12 block transition-colors duration-300 motion-reduce:transition-none xl:whitespace-nowrap ${on ? "text-fg-strong" : "text-black/60"}`}
                  >
                    {step.lines.map((line, n) => (
                      <Fragment key={line}>
                        {n > 0 && (
                          <>
                            <br className="max-xl:hidden" />{" "}
                          </>
                        )}
                        {line}
                      </Fragment>
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
