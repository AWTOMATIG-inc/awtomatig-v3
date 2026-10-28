"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RGB = [number, number, number];

export type LinesLaser = {
  /** Distance from the top-right corner, measured across the lines, in 1440px-frame design px */
  dist: number;
  width: number;
  alpha: number;
  /** Visible length from the frame edge before the laser has faded out */
  fadeLength: number;
};

/** The art of one animated lines background, measured from its Figma screenshot. */
export type LinesPreset = {
  /** Base gradient of the section (CSS `background`) */
  background: string;
  /** Angle of the lines: 0 = horizontal, negative = rising to the right, 90 = vertical (lasers rise from the bottom edge) */
  angleDeg: number;
  /** Faint sawtooth bands: one every `bandPeriod` design px, `bandAlpha` white at their crisp edge */
  bandPeriod: number;
  bandAlpha: number;
  /** Lasers sit on band edges: the band grid starts at the first laser */
  lasers: LinesLaser[];
  /** Band strength across the section: an ellipse (radii as a fraction of the section width / height) centred on
   *  `origin` (fraction of width / height, default the top-right corner) with [radius, strength] stops */
  mask: { rx: number; ry: number; origin?: [x: number, y: number]; stops: [radius: number, strength: number][] };
  /** Where the "pointer" rests when nobody hovers (fraction of width / height), away from the lasers */
  rest: [x: number, y: number];
  /** Colour and opacity along a laser (see LASER_STOPS); omit for the default near-white head */
  laserStops?: [offset: number, color: RGB, alpha: number][];
};

type Stripe = { dist: number; width: number; isLaser: boolean; alpha: number; fadeLength?: number };

// The designs are drawn on a 1440px wide frame
const DESIGN_WIDTH = 1440;
const BAND_COLOR: RGB = [255, 255, 255];
const CYAN = "#02d5e8";

// Colour along a laser, from the frame edge (0) to the end of its fade (1): near-white -> light cyan -> cyan -> gone
const LASER_STOPS: [offset: number, color: RGB, alpha: number][] = [
  [0, [235, 252, 253], 1],
  [0.06, [150, 228, 235], 1],
  [0.15, [2, 205, 224], 1],
  [0.4, [2, 200, 220], 0.72],
  [0.6, [2, 190, 210], 0.48],
  [0.8, [2, 180, 200], 0.2],
  [1, [2, 180, 200], 0],
];

// The compact preset (when given) replaces the main one on phones, below the md breakpoint
const WIDE_QUERY = "(min-width: 48rem)";

type LinesBackgroundProps = {
  preset: LinesPreset;
  /** Art for phones (below md), measured from the mobile design; the section's gradient switches in CSS */
  compact?: LinesPreset;
  id?: string;
  /** Layout of the section (display, min-height…). Positioning and clipping are built in. */
  className?: string;
  /** Marks a hero's section so the header's scroll logic can find it without depending on a CSS class (the `.hero`
   *  class stays reserved for the frame-scale CSS). Omit on non-hero uses, such as the CTA section. */
  "data-hero"?: true;
  "aria-labelledby"?: string;
  children: ReactNode;
};

/**
 * Full-bleed section with the animated lines background shared by the hero and the CTA section:
 * base gradient, a pointer-following glow, film grain and a canvas of sawtooth bands and two lasers
 * that bend away from the pointer. Content goes in `children` (give it `relative z-20`).
 */
export default function LinesBackground({
  preset,
  compact,
  id,
  className,
  "data-hero": dataHero,
  "aria-labelledby": labelledBy,
  children,
}: LinesBackgroundProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const glow = glowRef.current;
    if (!section || !canvas || !glow) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The active preset follows the layout; applyPreset() re-derives everything that depends on it
    const wide = window.matchMedia(WIDE_QUERY);
    let cfg = preset;
    let dirX = 0;
    let dirY = 0;
    // Normal vector (perpendicular to the lines, pointing away from the top-right corner)
    let normX = 0;
    let normY = 0;
    let bandOrigin = 0;
    let laserStripes: Stripe[] = [];
    const applyPreset = () => {
      cfg = compact && !wide.matches ? compact : preset;
      const rad = (cfg.angleDeg * Math.PI) / 180;
      dirX = Math.cos(rad);
      dirY = Math.sin(rad);
      normX = -Math.sin(rad);
      normY = Math.cos(rad);
      bandOrigin = cfg.lasers[0]?.dist ?? 0;
      laserStripes = cfg.lasers.map((l) => ({ ...l, isLaser: true }));
    };
    applyPreset();

    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;
    let frameId = 0;
    let stripes: Stripe[] = laserStripes;
    // The loop runs only while the section is on screen and motion is allowed; otherwise one still frame is drawn
    let isVisible = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Pointer coordinates & smooth spring-based lerp tracking
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, isHovered: false };

    const resetPointerTarget = () => {
      pointer.targetX = width * cfg.rest[0];
      pointer.targetY = height * cfg.rest[1];
    };

    const onResize = () => {
      applyPreset();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = section.clientWidth;
      height = section.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!pointer.isHovered) resetPointerTarget();

      // Bands cover the whole section: from the corner furthest "above" the lines to the one furthest below
      const scale = Math.min(Math.max(width / DESIGN_WIDTH, 0.55), 1.4);
      const corners = [
        [-width, 0],
        [0, 0],
        [-width, height],
        [0, height],
      ].map(([x, y]) => (x * normX + y * normY) / scale);
      const { bandPeriod, bandAlpha } = cfg;
      const first = Math.floor((Math.min(...corners) - bandOrigin) / bandPeriod) - 1;
      const last = Math.ceil((Math.max(...corners) - bandOrigin) / bandPeriod) + 1;
      // No bands at all when the preset has none (the phone hero shows only a laser)
      const bands =
        bandAlpha > 0
          ? Array.from({ length: last - first + 1 }, (_, i): Stripe => ({
              dist: bandOrigin + (first + i) * bandPeriod,
              width: bandPeriod,
              isLaser: false,
              alpha: bandAlpha,
            }))
          : [];
      stripes = [...bands, ...laserStripes];

      // Resizing clears the canvas: repaint at once when the loop isn't running
      if (!frameId) drawStill();
    };

    const setPointerPos = (cx: number, cy: number) => {
      const rect = section.getBoundingClientRect();
      pointer.targetX = cx - rect.left;
      pointer.targetY = cy - rect.top;
      pointer.isHovered = true;
    };

    const onPointerMove = (e: PointerEvent) => setPointerPos(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) setPointerPos(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onPointerLeave = () => {
      pointer.isHovered = false;
      resetPointerTarget();
    };

    const resizeObserver = new ResizeObserver(onResize);

    // Paints one frame for the current `time` and pointer position
    const draw = () => {
      // Parallax drift for the background ambient glow
      glow.style.setProperty("--glow-x", `${(pointer.x / width - 0.5) * 40}px`);
      glow.style.setProperty("--glow-y", `${(pointer.y / height - 0.5) * 40}px`);

      ctx.clearRect(0, 0, width, height);

      // Design px -> screen px
      const scale = Math.min(Math.max(width / DESIGN_WIDTH, 0.55), 1.4);

      // Origin anchored at the top-right corner
      const originX = width;
      const originY = 0;
      const span = Math.hypot(width, height) * 1.6;

      const lines = stripes.map((stripe) => {
        // Phase comes from the position, so a laser sways with its band and the bands stay evenly spaced
        const phase = stripe.dist / cfg.bandPeriod;

        // Continuous organic harmonic wave undulation
        const wave1 = Math.sin(time * 1.25 + phase * 0.12);
        const wave2 = Math.cos(time * 0.85 + phase * 0.08);
        const continuousShift = (wave1 * 7.5 + wave2 * 4.5) * scale;

        // Breathing opacity wave
        const alphaBreath = 1 + Math.sin(time * 1.5 + phase * 0.5) * 0.12;

        // Base anchor along normal
        const offset = stripe.dist * scale + continuousShift;
        const lineBaseX = originX + normX * offset;
        const lineBaseY = originY + normY * offset;

        // Two points creating the infinite line
        const p1x = lineBaseX - dirX * span;
        const p1y = lineBaseY - dirY * span;
        const p2x = lineBaseX + dirX * span;
        const p2y = lineBaseY + dirY * span;

        // Pointer proximity deflection (rubber-sheet physics)
        const mx = pointer.x;
        const my = pointer.y;
        const dx = p2x - p1x;
        const dy = p2y - p1y;
        const lenSq = dx * dx + dy * dy;
        const t = Math.max(0, Math.min(1, ((mx - p1x) * dx + (my - p1y) * dy) / lenSq));
        const dist = Math.hypot(mx - (p1x + t * dx), my - (p1y + t * dy));

        // Interactive deflection bell curve
        const interactionRadius = stripe.isLaser ? 240 : 160;
        const influence = Math.max(0, 1 - dist / interactionRadius);
        const pushAmount = Math.sin(t * Math.PI) * influence * (stripe.isLaser ? 16 : 8);

        return {
          stripe,
          alphaBreath,
          influence,
          baseX: lineBaseX + normX * pushAmount,
          baseY: lineBaseY + normY * pushAmount,
          curP1x: p1x + normX * pushAmount,
          curP1y: p1y + normY * pushAmount,
          curP2x: p2x + normX * pushAmount,
          curP2y: p2y + normY * pushAmount,
        };
      });

      // 1. Translucent sawtooth bands: crisp edge on the corner side, even fade across one period
      for (const { stripe, alphaBreath, influence, curP1x, curP1y, curP2x, curP2y } of lines) {
        if (stripe.isLaser) continue;

        const bw = stripe.width * scale;
        const bAlpha = stripe.alpha * alphaBreath * (1 + influence * 0.6);

        ctx.beginPath();
        ctx.moveTo(curP1x, curP1y);
        ctx.lineTo(curP2x, curP2y);
        ctx.lineTo(curP2x + normX * bw, curP2y + normY * bw);
        ctx.lineTo(curP1x + normX * bw, curP1y + normY * bw);
        ctx.closePath();

        const grad = ctx.createLinearGradient(curP1x, curP1y, curP1x + normX * bw, curP1y + normY * bw);
        const [r, g, b] = BAND_COLOR;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${bAlpha})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Band strength across the section, measured from the design
      ctx.save();
      ctx.globalCompositeOperation = "destination-in";
      const { mask } = cfg;
      const [maskX, maskY] = mask.origin ?? [1, 0];
      ctx.setTransform(dpr * width * mask.rx, 0, 0, dpr * height * mask.ry, dpr * width * maskX, dpr * height * maskY);
      const maskGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      for (const [radius, strength] of mask.stops) {
        maskGrad.addColorStop(radius, `rgba(0, 0, 0, ${strength})`);
      }
      ctx.fillStyle = maskGrad;
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();

      // 2. Crisp lasers, brightest at the frame edge and fading away from it
      for (const { stripe, alphaBreath, influence, baseX, baseY, curP1x, curP1y, curP2x, curP2y } of lines) {
        if (!stripe.isLaser) continue;

        // Point where the laser leaves the section: the right edge, the top edge for rising lines, the bottom edge for vertical ones
        const tRight = dirX > 1e-6 ? (width - baseX) / dirX : Infinity;
        const tTop = dirY < -1e-6 ? -baseY / dirY : Infinity;
        const tBottom = dirY > 1e-6 ? (height - baseY) / dirY : Infinity;
        const tExit = Math.min(tRight, tTop, tBottom);
        const exitX = baseX + dirX * tExit;
        const exitY = baseY + dirY * tExit;
        const fade = (stripe.fadeLength ?? 400) * scale;

        const laserAlpha = Math.min(1, stripe.alpha * alphaBreath * (1 + influence * 0.35));

        // Linear gradient along the laser: near-white at the frame edge, through cyan, fading out
        const laserGrad = ctx.createLinearGradient(exitX, exitY, exitX - dirX * fade, exitY - dirY * fade);
        for (const [offset, [r, g, b], a] of cfg.laserStops ?? LASER_STOPS) {
          laserGrad.addColorStop(offset, `rgba(${r}, ${g}, ${b}, ${a * laserAlpha})`);
        }

        // Crisp line at rest; a soft cyan glow only appears while the pointer is near
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(curP1x, curP1y);
        ctx.lineTo(curP2x, curP2y);
        ctx.strokeStyle = laserGrad;
        ctx.lineWidth = stripe.width * scale + influence * 1.2;
        ctx.shadowColor = CYAN;
        ctx.shadowBlur = influence * 14;
        ctx.stroke();
        ctx.restore();
      }
    };

    const tick = () => {
      time += 0.016;
      // Smooth pointer lerp
      pointer.x += (pointer.targetX - pointer.x) * 0.05;
      pointer.y += (pointer.targetY - pointer.y) * 0.05;
      draw();
      frameId = requestAnimationFrame(tick);
    };

    // One frame with the pointer settled on its target (the rest point unless hovered): reduced motion, and repaints while paused
    function drawStill() {
      pointer.x = pointer.targetX;
      pointer.y = pointer.targetY;
      draw();
    }

    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    // Starts or stops the loop to match visibility and the motion preference
    const sync = () => {
      const shouldRun = isVisible && !reducedMotion.matches;
      if (shouldRun && !frameId) frameId = requestAnimationFrame(tick);
      else if (!shouldRun && frameId) stop();
      if (reducedMotion.matches) drawStill();
    };

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      sync();
    });

    onResize();
    resizeObserver.observe(section);
    intersectionObserver.observe(section);
    reducedMotion.addEventListener("change", sync);
    section.addEventListener("pointermove", onPointerMove);
    section.addEventListener("touchstart", onTouch, { passive: true });
    section.addEventListener("touchmove", onTouch, { passive: true });
    section.addEventListener("pointerleave", onPointerLeave);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      reducedMotion.removeEventListener("change", sync);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("touchstart", onTouch);
      section.removeEventListener("touchmove", onTouch);
      section.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [preset, compact]);

  return (
    <section
      ref={sectionRef}
      id={id}
      data-hero={dataHero}
      aria-labelledby={labelledBy}
      className={`lines-bg relative overflow-hidden ${className ?? ""}`}
      style={{ "--lines-bg": preset.background, "--lines-bg-compact": (compact ?? preset).background } as CSSProperties}
    >
      {/* Soft cyan bloom in the top-right corner, drifts with the pointer */}
      <div ref={glowRef} className="lines-bg-glow" aria-hidden="true" />

      {/* Film grain */}
      <div className="lines-bg-noise" aria-hidden="true" />

      {/* Bands and lasers */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 size-full" aria-hidden="true" />

      {children}
    </section>
  );
}
