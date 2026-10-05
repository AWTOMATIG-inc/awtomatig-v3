import type { LinesPreset } from "@/app/components/ui";

// CTA background, measured from the Figma screenshot (scale 0.696 of the 1440 frame): the hero's atmosphere
// with horizontal lines. The section is much shorter than the hero, so its teal fades mostly from right to left.
export const CTA_LINES: LinesPreset = {
  background:
    "radial-gradient(ellipse 100% 280% at 100% 0%, #1b4145 0%, #1b4044 17%, #1b3a3d 32%, #1c3335 47%, #1c2b2d 62%, #1d2425 77%, #1e2020 90%, var(--color-charcoal) 100%)",
  angleDeg: 0,
  bandPeriod: 70,
  bandAlpha: 0.031,
  lasers: [
    // Laser 1: 253 design px below the section top, fades out over ~330px
    { dist: 180, width: 2, alpha: 0.88, fadeLength: 330 },
    // Laser 2: one band lower and shorter
    { dist: 250, width: 1.8, alpha: 0.8, fadeLength: 150 },
  ],
  // Full at the right edge, ~70% at the top-middle, ~40% bottom-right, ~25% bottom-centre, none in the left third
  mask: {
    rx: 0.75,
    ry: 2,
    stops: [
      [0, 1],
      [0.2, 1],
      [0.36, 0.68],
      [0.48, 0.45],
      [0.86, 0.24],
      [1, 0],
    ],
  },
  // Below both lasers, so they rest straight
  rest: [0.3, 0.95],
};
