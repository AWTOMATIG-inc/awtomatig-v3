import type { LinesPreset } from "@/app/components/ui";

// Contact "Book a conversation" background, sampled from the Figma screenshot (scale 0.5 of the 1440 frame): the Trusted
// operations backdrop with its two lasers moved to the left, at 16% and 22% of the width (1210 / 1123 design px from the
// right edge), rising from the bottom edge over a teal swell.
export const BOOKING_LINES: LinesPreset = {
  background:
    "radial-gradient(ellipse 80% 90% at 30% 100%, #1a4043 0%, rgb(26 64 67 / 0) 100%), linear-gradient(to bottom, #1e2020 0%, #1c2e30 100%)",
  angleDeg: 90,
  bandPeriod: 87,
  bandAlpha: 0.022,
  lasers: [
    { dist: 1210, width: 2, alpha: 1, fadeLength: 200 },
    { dist: 1123, width: 1.8, alpha: 0.85, fadeLength: 110 },
  ],
  mask: {
    rx: 0.5,
    ry: 0.85,
    origin: [0.2, 1],
    stops: [
      [0, 1],
      [0.4, 0.75],
      [1, 0],
    ],
  },
  // Far from both lasers, so they rest straight
  rest: [0.8, 0.2],
};
