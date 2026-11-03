import type { LinesPreset } from "@/app/components/ui";

// Capabilities background, sampled from the design screenshot (scale 0.602 of the 1440 frame): the Trusted operations
// backdrop (charcoal fading to a teal swell at the bottom, vertical bands) with two short lasers rising from the bottom edge
// at 33.6% and 39.1% of the width (957 / 877 design px from the right edge; the right one reaches about 150 design px up).
export const CAPABILITIES_LINES: LinesPreset = {
  background:
    "radial-gradient(ellipse 70% 40% at 50% 100%, #1a4043 0%, rgb(26 64 67 / 0) 100%), linear-gradient(to bottom, #1e1e1e 0%, #1c2e30 100%)",
  angleDeg: 90,
  bandPeriod: 87,
  bandAlpha: 0.022,
  lasers: [
    { dist: 947, width: 1.8, alpha: 0.9, fadeLength: 110 },
    { dist: 867, width: 2, alpha: 1, fadeLength: 170 },
  ],
  mask: {
    rx: 0.76,
    ry: 0.5,
    origin: [0.4, 1],
    stops: [
      [0, 1],
      [0.35, 0.8],
      [1, 0],
    ],
  },
  // Far from both lasers, so they rest straight
  rest: [0.85, 0.2],
};
