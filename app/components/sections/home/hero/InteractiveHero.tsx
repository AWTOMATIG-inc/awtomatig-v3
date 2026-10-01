"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RGB = [number, number, number];

type Stripe = {
  dist: number; // distance from the top-right corner along the normal, in 1440px-frame design px
  width: number;
  isLaser: boolean;
  alpha: number;
  fadeLength?: number; // lasers only: visible length from the frame edge before fading out
};

type Shockwave = {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  opacity: number;
};

// Angle measured from the design (~-28.3 degrees)
const BASE_ANGLE_DEG = -28.3;
const RAD = (BASE_ANGLE_DEG * Math.PI) / 180;
const DIR_X = Math.cos(RAD);
const DIR_Y = Math.sin(RAD);
// Normal vector (perpendicular to the diagonal, pointing away from the top-right corner)
const NORM_X = -Math.sin(RAD);
const NORM_Y = Math.cos(RAD);

// The design is drawn on a 1440px wide frame
const DESIGN_WIDTH = 1440;

// Faint diagonal bands repeat every ~78 design px across the whole hero; the two lasers sit on band edges.
// Each band is a sawtooth: a crisp white edge on the corner side that fades evenly to nothing over one period.
const BAND_PERIOD = 75;
const BAND_ALPHA = 0.054;
const BAND_COLOR: RGB = [255, 255, 255];
const LASER_OFFSET = 20;
const CYAN = "#02d5e8";

const LASERS: Stripe[] = [
  // Laser Line 1 (the long bright laser reaching the top-right corner)
  { dist: LASER_OFFSET, width: 2, isLaser: true, alpha: 0.88, fadeLength: 470 },

  // Laser Line 2 (the shorter laser just below it)
  { dist: LASER_OFFSET + BAND_PERIOD, width: 1.8, isLaser: true, alpha: 0.7, fadeLength: 180 },
];

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

export default function InteractiveHero({ children }: { children: ReactNode }) {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    const glow = glowRef.current;
    if (!hero || !canvas || !glow) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;
    let frameId = 0;
    let stripes: Stripe[] = LASERS;

    // Pointer coordinates & smooth spring-based lerp tracking
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, isHovered: false };

    // Click/touch ripple pulses storage
    const shockwaves: Shockwave[] = [];

    // Resting pointer target sits away from the lasers so they rest straight, as in the design
    function resetPointerTarget() {
      pointer.targetX = width * 0.55;
      pointer.targetY = height * 0.7;
    }

    function onResize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = hero!.clientWidth;
      height = hero!.clientHeight;

      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!pointer.isHovered) resetPointerTarget();

      // Bands cover the whole hero: from the top-left corner (furthest "above" the lines) to the bottom edge
      const scale = Math.min(Math.max(width / DESIGN_WIDTH, 0.55), 1.4);
      const minDist = (-width * NORM_X) / scale;
      const maxDist = (height * NORM_Y) / scale;
      const first = Math.floor((minDist - LASER_OFFSET) / BAND_PERIOD) - 1;
      const last = Math.ceil((maxDist - LASER_OFFSET) / BAND_PERIOD) + 1;
      const bands = Array.from({ length: last - first + 1 }, (_, i): Stripe => ({
        dist: LASER_OFFSET + (first + i) * BAND_PERIOD,
        width: BAND_PERIOD,
        isLaser: false,
        alpha: BAND_ALPHA,
      }));
      stripes = [...bands, ...LASERS];
    }

    function setPointerPos(cx: number, cy: number) {
      const rect = hero!.getBoundingClientRect();
      pointer.targetX = cx - rect.left;
      pointer.targetY = cy - rect.top;
      pointer.isHovered = true;
    }

    const onPointerMove = (e: PointerEvent) => setPointerPos(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) setPointerPos(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onPointerLeave = () => {
      pointer.isHovered = false;
      resetPointerTarget();
    };
    

    const resizeObserver = new ResizeObserver(onResize);

    function render() {
      time += 0.016;

      // Smooth pointer lerp
      pointer.x += (pointer.targetX - pointer.x) * 0.05;
      pointer.y += (pointer.targetY - pointer.y) * 0.05;

      // Parallax drift for the background ambient glow
      const glowShiftX = (pointer.x / width - 0.5) * 40;
      const glowShiftY = (pointer.y / height - 0.5) * 40;
      glow!.style.setProperty("--glow-x", `${glowShiftX}px`);
      glow!.style.setProperty("--glow-y", `${glowShiftY}px`);

      ctx!.clearRect(0, 0, width, height);

      // Design px -> screen px
      const scale = Math.min(Math.max(width / DESIGN_WIDTH, 0.55), 1.4);

      // Origin anchored at the top-right corner
      const originX = width;
      const originY = 0;
      const span = Math.hypot(width, height) * 1.6;

      const lines = stripes.map((stripe) => {
        // Phase comes from the position, so a laser sways with its band and the bands stay evenly spaced
        const phase = stripe.dist / BAND_PERIOD;

        // Continuous organic harmonic wave undulation
        const wave1 = Math.sin(time * 1.25 + phase * 0.12);
        const wave2 = Math.cos(time * 0.85 + phase * 0.08);
        const continuousShift = (wave1 * 7.5 + wave2 * 4.5) * scale;

        // Breathing opacity wave
        const alphaBreath = 1 + Math.sin(time * 1.5 + phase * 0.5) * 0.12;

        // Base anchor along normal
        const offset = stripe.dist * scale + continuousShift;
        const lineBaseX = originX + NORM_X * offset;
        const lineBaseY = originY + NORM_Y * offset;

        // Two points creating the infinite diagonal segment
        const p1x = lineBaseX - DIR_X * span;
        const p1y = lineBaseY - DIR_Y * span;
        const p2x = lineBaseX + DIR_X * span;
        const p2y = lineBaseY + DIR_Y * span;

        // Pointer proximity deflection (rubber-sheet physics)
        const mx = pointer.x;
        const my = pointer.y;
        const dx = p2x - p1x;
        const dy = p2y - p1y;
        const lenSq = dx * dx + dy * dy;
        const t = Math.max(0, Math.min(1, ((mx - p1x) * dx + (my - p1y) * dy) / lenSq));
        const projX = p1x + t * dx;
        const projY = p1y + t * dy;
        const dist = Math.hypot(mx - projX, my - projY);

        // Interactive deflection bell curve
        const interactionRadius = stripe.isLaser ? 240 : 160;
        const influence = Math.max(0, 1 - dist / interactionRadius);
        const pushAmount = Math.sin(t * Math.PI) * influence * (stripe.isLaser ? 16 : 8);

        return {
          stripe,
          alphaBreath,
          influence,
          baseX: lineBaseX + NORM_X * pushAmount,
          baseY: lineBaseY + NORM_Y * pushAmount,
          curP1x: p1x + NORM_X * pushAmount,
          curP1y: p1y + NORM_Y * pushAmount,
          curP2x: p2x + NORM_X * pushAmount,
          curP2y: p2y + NORM_Y * pushAmount,
        };
      });

      // 1. Translucent sawtooth bands: crisp edge on the corner side, even fade across one period
      for (const { stripe, alphaBreath, influence, curP1x, curP1y, curP2x, curP2y } of lines) {
        if (stripe.isLaser) continue;

        const bw = stripe.width * scale;
        const bAlpha = stripe.alpha * alphaBreath * (1 + influence * 0.6);

        ctx!.save();
        ctx!.beginPath();
        ctx!.moveTo(curP1x, curP1y);
        ctx!.lineTo(curP2x, curP2y);
        ctx!.lineTo(curP2x + NORM_X * bw, curP2y + NORM_Y * bw);
        ctx!.lineTo(curP1x + NORM_X * bw, curP1y + NORM_Y * bw);
        ctx!.closePath();

        // Gradient across normal vector
        const grad = ctx!.createLinearGradient(curP1x, curP1y, curP1x + NORM_X * bw, curP1y + NORM_Y * bw);
        const [r, g, b] = BAND_COLOR;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${bAlpha})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx!.fillStyle = grad;
        ctx!.fill();
        ctx!.restore();
      }

      // Band strength measured from the design: full in the top-right, ~35% beside the headline,
      // ~20% along the bottom and middle-left, almost gone in the bottom-left corner
      ctx!.save();
      ctx!.globalCompositeOperation = "destination-in";
      ctx!.setTransform(dpr * width * 1.265, 0, 0, dpr * height * 1.7, dpr * width, 0);
      const mask = ctx!.createRadialGradient(0, 0, 0, 0, 0, 1);
      mask.addColorStop(0, "rgba(0, 0, 0, 1)");
      mask.addColorStop(0.26, "rgba(0, 0, 0, 0.82)");
      mask.addColorStop(0.57, "rgba(0, 0, 0, 0.37)");
      mask.addColorStop(0.74, "rgba(0, 0, 0, 0.2)");
      mask.addColorStop(0.96, "rgba(0, 0, 0, 0.04)");
      mask.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx!.fillStyle = mask;
      ctx!.fillRect(-2, -1, 4, 3);
      ctx!.restore();

      // 2. Sharp glowing razor lasers, brightest at the frame edge and fading toward the lower left
      for (const { stripe, alphaBreath, influence, baseX, baseY, curP1x, curP1y, curP2x, curP2y } of lines) {
        if (!stripe.isLaser) continue;

        // Point where the laser leaves the hero (right edge or top edge)
        const tRight = (width - baseX) / DIR_X;
        const tTop = (0 - baseY) / DIR_Y;
        const tExit = Math.min(tRight, tTop);
        const exitX = baseX + DIR_X * tExit;
        const exitY = baseY + DIR_Y * tExit;
        const fade = (stripe.fadeLength || 400) * scale;
        const endX = exitX - DIR_X * fade;
        const endY = exitY - DIR_Y * fade;

        const laserAlpha = Math.min(1, stripe.alpha * alphaBreath * (1 + influence * 0.35));

        // Linear gradient along the laser: near-white at the frame edge, through cyan, fading out
        const laserGrad = ctx!.createLinearGradient(exitX, exitY, endX, endY);
        for (const [offset, [r, g, b], a] of LASER_STOPS) {
          laserGrad.addColorStop(offset, `rgba(${r}, ${g}, ${b}, ${a * laserAlpha})`);
        }

        // Crisp line at rest; a soft cyan glow only appears while the pointer is near
        ctx!.save();
        ctx!.beginPath();
        ctx!.moveTo(curP1x, curP1y);
        ctx!.lineTo(curP2x, curP2y);
        ctx!.strokeStyle = laserGrad;
        ctx!.lineWidth = stripe.width * scale + influence * 1.2;
        ctx!.shadowColor = CYAN;
        ctx!.shadowBlur = influence * 14;
        ctx!.stroke();

        ctx!.restore();
      }

      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += sw.speed;
        sw.opacity -= 0.016;

        if (sw.opacity <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx!.save();
        ctx!.beginPath();
        // Slightly skewed ellipse along the diagonal plane
        ctx!.ellipse(sw.x, sw.y, sw.radius, sw.radius * 0.65, RAD, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(2, 213, 232, ${sw.opacity * 0.55})`;
        ctx!.lineWidth = 2.2;
        ctx!.shadowColor = CYAN;
        ctx!.shadowBlur = 14;
        ctx!.stroke();
        ctx!.restore();
      }

      frameId = requestAnimationFrame(render);
    }

    onResize();
    resizeObserver.observe(hero);
    hero.addEventListener("pointermove", onPointerMove);
    hero.addEventListener("touchstart", onTouch, { passive: true });
    hero.addEventListener("touchmove", onTouch, { passive: true });
    hero.addEventListener("pointerleave", onPointerLeave);
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("touchstart", onTouch);
      hero.removeEventListener("touchmove", onTouch);
      hero.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="hero relative flex min-h-svh flex-col overflow-hidden"
    >
      {/* Deep Ambient Glow Layer */}
      <div ref={glowRef} className="top-right-glow" />

      {/* Film Grain Overlay */}
      <div className="noise-overlay" />

      {/* The Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Foreground Content Layer */}
      {children}
    </section>
  );
}
