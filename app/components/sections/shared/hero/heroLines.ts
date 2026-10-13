import type { LinesPreset } from "@/app/components/ui";

// Home hero background, measured from the Figma screenshots (MEMORY.md D17): diagonal lines rising to the right
export const HERO_LINES: LinesPreset = {
  // Neutral charcoal base with the teal bloom from the top-right corner
  background:
    "radial-gradient(ellipse 96% 135% at 100% 0%, #1b4145 0%, #1c3437 36%, #1d3032 54%, #1d2627 72%, #1d2121 88%, var(--color-charcoal) 100%)",
  angleDeg: -28.3,
  bandPeriod: 75,
  bandAlpha: 0.054,
  lasers: [
    // Laser 1: the long bright laser reaching the top-right corner
    { dist: 20, width: 2, alpha: 0.88, fadeLength: 470 },
    // Laser 2: the shorter laser one band below it
    { dist: 95, width: 1.8, alpha: 0.7, fadeLength: 180 },
  ],
  // Full in the top-right, ~35% beside the headline, ~20% along the bottom and middle-left, almost gone bottom-left
  mask: {
    rx: 1.265,
    ry: 1.7,
    stops: [
      [0, 1],
      [0.26, 0.82],
      [0.57, 0.37],
      [0.74, 0.2],
      [0.96, 0.04],
      [1, 0],
    ],
  },
  rest: [0.55, 0.7],
};

// Home hero on phones (below md), measured from the 408px mobile screenshot: a weaker teal bloom that falls off roughly linearly from the
// top-right corner (corner rgb 29,50,53 → 30,32,32 at the bottom-left), no bands, and one plain cyan laser that crosses the
// right edge 148px down (offset 130px = 230 design px at the 0.55 phone scale) and fades out 265px later. The gradient
// is a 144% x 172% ellipse whose linear falloff was fitted to the sampled colours (the grain and glow layers add the rest).
export const HERO_LINES_COMPACT: LinesPreset = {
  background: "radial-gradient(ellipse 144% 172% at 100% 0%, #1c2d30 0%, var(--color-charcoal) 100%)",
  angleDeg: -28.3,
  bandPeriod: 75,
  bandAlpha: 0,
  lasers: [{ dist: 230, width: 3, alpha: 0.85, fadeLength: 491 }],
  // Measured alpha along the laser (at 9 / 66 / 100 / 134 / 168 / 202 / 231px from the edge: .76 / .59 / .49 / .38 / .26 / .18 / .09)
  laserStops: [
    [0, [2, 205, 224], 0.85],
    [0.25, [2, 205, 224], 0.66],
    [0.37, [2, 205, 224], 0.55],
    [0.5, [2, 205, 224], 0.42],
    [0.62, [2, 205, 224], 0.29],
    [0.75, [2, 205, 224], 0.2],
    [0.86, [2, 205, 224], 0.1],
    [1, [2, 205, 224], 0],
  ],
  mask: HERO_LINES.mask,
  rest: [0.55, 0.7],
};
