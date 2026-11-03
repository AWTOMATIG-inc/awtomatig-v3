import type { LinesPreset } from "@/app/components/ui";

// "What changes" background, sampled from the design screenshot (scale 0.539 of the 1440 frame): the Trusted operations
// backdrop (a teal swell at the bottom centre over a charcoal-teal fade) with its two vertical lasers at 51.7% and 57.8%
// of the width; the left one reaches about 100 design px up, the right one about 55.
export const WHAT_CHANGES_LINES: LinesPreset = {
  background:
    "radial-gradient(ellipse 70% 40% at 50% 100%, #1a4043 0%, rgb(26 64 67 / 0) 100%), linear-gradient(to bottom, #1d2526 0%, #1c2c2e 50%, #1c2e30 100%)",
  angleDeg: 90,
  bandPeriod: 87,
  bandAlpha: 0.022,
  lasers: [
    { dist: 688, width: 2, alpha: 1, fadeLength: 115 },
    { dist: 601, width: 1.8, alpha: 0.85, fadeLength: 65 },
  ],
  mask: {
    rx: 0.76,
    ry: 0.5,
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
