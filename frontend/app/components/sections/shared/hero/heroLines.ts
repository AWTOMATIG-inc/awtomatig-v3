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
