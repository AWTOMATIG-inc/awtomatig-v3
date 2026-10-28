import type { LinesPreset } from "@/app/components/ui";

// Trusted operations background, sampled from the Figma screenshot (scale 0.8 of the 1440 frame): the hero's lines turned
// vertical. Two lasers rise from the bottom edge at 51.5% and 57.6% of the width (698 / 611 design px from the right edge),
// over a teal swell at the bottom centre and faint bands strongest there.
export const TRUSTED_LINES: LinesPreset = {
  background:
    "radial-gradient(ellipse 70% 110% at 50% 100%, #1a4043 0%, rgb(26 64 67 / 0) 100%), linear-gradient(to bottom, #1e2323 0%, #1c2e30 65%, #1c2e30 100%)",
  angleDeg: 90,
  bandPeriod: 87,
  bandAlpha: 0.022,
  lasers: [
    { dist: 698, width: 2, alpha: 1, fadeLength: 200 },
    { dist: 611, width: 1.8, alpha: 0.85, fadeLength: 110 },
  ],
  mask: {
    rx: 0.76,
    ry: 0.85,
    origin: [0.5, 1],
    stops: [
      [0, 1],
      [0.35, 0.8],
      [1, 0],
    ],
  },
  // Far from both lasers, so they rest straight
  rest: [0.1, 0.2],
};
