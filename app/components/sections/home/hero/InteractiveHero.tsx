"use client";

import { useEffect, useRef, type ReactNode } from "react";

type RGB = [number, number, number];

type Stripe = {
  dist: number; // distance from the top-right corner along the normal, in 1440px-frame design px
  width: number;
  isLaser: boolean;
  alpha: number;
  color: RGB;
  bandWidth?: number;
  bandAlpha?: number;
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

// The design is drawn on a 1440px wide frame
const DESIGN_WIDTH = 1440;

// Faint diagonal slats repeat every ~77 design px; the two lasers sit on slat edges
const BAND_PERIOD = 77;
const LASER_OFFSET = 12;
const CYAN: RGB = [2, 213, 232];

const STRIPES: Stripe[] = [
  ...Array.from({ length: 15 }, (_, k): Stripe => ({
    dist: LASER_OFFSET + (k - 1) * BAND_PERIOD,
    width: BAND_PERIOD * 0.55,
    isLaser: false,
    alpha: 0.028,
    color: CYAN,
  })),

  // Laser Line 1 (the long bright laser reaching the top-right corner)
  { dist: LASER_OFFSET, width: 2, isLaser: true, alpha: 0.95, color: CYAN, bandWidth: 60, bandAlpha: 0.04, fadeLength: 480 },

  // Laser Line 2 (the shorter laser just below it)
  { dist: LASER_OFFSET + BAND_PERIOD, width: 1.8, isLaser: true, alpha: 0.85, color: CYAN, bandWidth: 60, bandAlpha: 0.035, fadeLength: 330 },
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
    // Tap / Click creates high-energy radial shockwave
    const onPointerDown = (e: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      shockwaves.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.85,
        speed: 8.5,
        opacity: 0.95,
      });
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

      // Trigonometry vectors based on angle
      const rad = (BASE_ANGLE_DEG * Math.PI) / 180;
      const dirX = Math.cos(rad);
      const dirY = Math.sin(rad);

      // Normal vector (perpendicular to the diagonal, pointing down-left into the hero)
      const normX = -Math.sin(rad);
      const normY = Math.cos(rad);

      // Origin anchored at the top-right corner
      const originX = width;
      const originY = 0;
      const span = Math.hypot(width, height) * 1.6;

      const lines = STRIPES.map((stripe, index) => {
        // Continuous organic harmonic wave undulation
        const wave1 = Math.sin(time * 1.25 + index * 0.45);
        const wave2 = Math.cos(time * 0.85 + index * 0.3);
        const continuousShift = (wave1 * 7.5 + wave2 * 4.5) * scale;

        // Breathing opacity wave
        const alphaBreath = 1 + Math.sin(time * 1.5 + index * 0.5) * 0.12;

        // Base anchor along normal
        const offset = stripe.dist * scale + continuousShift;
        const lineBaseX = originX + normX * offset;
        const lineBaseY = originY + normY * offset;

        // Two points creating the infinite diagonal segment
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
          baseX: lineBaseX + normX * pushAmount,
          baseY: lineBaseY + normY * pushAmount,
          curP1x: p1x + normX * pushAmount,
          curP1y: p1y + normY * pushAmount,
          curP2x: p2x + normX * pushAmount,
          curP2y: p2y + normY * pushAmount,
        };
      });

      // 1. Translucent geometric bands (background slats + laser trailing bands)
      for (const { stripe, alphaBreath, influence, curP1x, curP1y, curP2x, curP2y } of lines) {
        if (!stripe.bandWidth && stripe.isLaser) continue;

        const bw = (stripe.bandWidth || stripe.width) * scale;
        const bAlpha = (stripe.bandAlpha || stripe.alpha) * alphaBreath * (1 + influence * 0.6);

        ctx!.save();
        ctx!.beginPath();
        ctx!.moveTo(curP1x, curP1y);
        ctx!.lineTo(curP2x, curP2y);
        ctx!.lineTo(curP2x + normX * bw, curP2y + normY * bw);
        ctx!.lineTo(curP1x + normX * bw, curP1y + normY * bw);
        ctx!.closePath();

        // Gradient across normal vector
        const grad = ctx!.createLinearGradient(curP1x, curP1y, curP1x + normX * bw, curP1y + normY * bw);
        const [r, g, b] = stripe.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${bAlpha})`);
        grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${bAlpha * 0.35})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx!.fillStyle = grad;
        ctx!.fill();
        ctx!.restore();
      }

      // Fade the bands out with the teal bloom so the lower-left stays neutral, as in the design
      ctx!.save();
      ctx!.globalCompositeOperation = "destination-in";
      ctx!.setTransform(dpr * width * 0.96, 0, 0, dpr * height * 1.35, dpr * width, 0);
      const mask = ctx!.createRadialGradient(0, 0, 0, 0, 0, 1);
      mask.addColorStop(0, "rgba(0, 0, 0, 1)");
      mask.addColorStop(0.45, "rgba(0, 0, 0, 0.6)");
      mask.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx!.fillStyle = mask;
      ctx!.fillRect(-2, -1, 4, 3);
      ctx!.restore();

      // 2. Sharp glowing razor lasers, brightest at the frame edge and fading toward the lower left
      for (const { stripe, alphaBreath, influence, baseX, baseY, curP1x, curP1y, curP2x, curP2y } of lines) {
        if (!stripe.isLaser) continue;

        // Point where the laser leaves the hero (right edge or top edge)
        const tRight = (width - baseX) / dirX;
        const tTop = (0 - baseY) / dirY;
        const tExit = Math.min(tRight, tTop);
        const exitX = baseX + dirX * tExit;
        const exitY = baseY + dirY * tExit;
        const fade = (stripe.fadeLength || 400) * scale;
        const endX = exitX - dirX * fade;
        const endY = exitY - dirY * fade;

        const [lr, lg, lb] = stripe.color;
        const laserAlpha = Math.min(1, stripe.alpha * alphaBreath * (1 + influence * 0.35));

        const glowGrad = ctx!.createLinearGradient(exitX, exitY, endX, endY);
        glowGrad.addColorStop(0, `rgba(${lr}, ${lg}, ${lb}, ${laserAlpha})`);
        glowGrad.addColorStop(0.15, `rgba(${lr}, ${lg}, ${lb}, ${laserAlpha * 0.9})`);
        glowGrad.addColorStop(0.5, `rgba(${lr}, ${lg}, ${lb}, ${laserAlpha * 0.45})`);
        glowGrad.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0)`);

        const coreGrad = ctx!.createLinearGradient(exitX, exitY, endX, endY);
        coreGrad.addColorStop(0, `rgba(255, 255, 255, ${laserAlpha * 0.9})`);
        coreGrad.addColorStop(0.3, `rgba(255, 255, 255, ${laserAlpha * 0.25})`);
        coreGrad.addColorStop(0.6, "rgba(255, 255, 255, 0)");

        ctx!.save();
        ctx!.beginPath();
        ctx!.moveTo(curP1x, curP1y);
        ctx!.lineTo(curP2x, curP2y);

        // Specular glow along line
        ctx!.strokeStyle = glowGrad;
        ctx!.lineWidth = stripe.width * scale + influence * 1.6;
        ctx!.shadowColor = "#02d5e8";
        ctx!.shadowBlur = 6 + influence * 22;
        ctx!.stroke();

        // Core ultra-bright razor center line
        ctx!.strokeStyle = coreGrad;
        ctx!.lineWidth = Math.max(0.7, stripe.width * scale * 0.4);
        ctx!.shadowBlur = 4;
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
        ctx!.ellipse(sw.x, sw.y, sw.radius, sw.radius * 0.65, rad, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(2, 213, 232, ${sw.opacity * 0.55})`;
        ctx!.lineWidth = 2.2;
        ctx!.shadowColor = "#02d5e8";
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
    hero.addEventListener("pointerdown", onPointerDown);
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("touchstart", onTouch);
      hero.removeEventListener("touchmove", onTouch);
      hero.removeEventListener("pointerleave", onPointerLeave);
      hero.removeEventListener("pointerdown", onPointerDown);
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
