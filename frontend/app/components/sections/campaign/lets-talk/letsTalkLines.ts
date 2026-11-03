import type { LinesPreset } from "@/app/components/ui";

// "Let's talk" background, sampled from the design screenshot (scale 0.7257 of the 1440 frame): the same charcoal-teal fade
// and bottom swell as "What changes", with two vertical lasers at 40.4% and 46.1% of the width; the right one reaches about
// 245 design px up, the left one about 80. (`dist` is 10 less than the measured distance: the engine draws a laser 10 px left.)
export const LETS_TALK_LINES: LinesPreset = {
  background:
    "radial-gradient(ellipse 70% 40% at 50% 100%, #1a3e42 0%, rgb(26 62 66 / 0) 100%), linear-gradient(to bottom, #1c2526 0%, #1c2c2e 50%, #1c2e30 100%)",
  angleDeg: 90,
  bandPeriod: 87,
  bandAlpha: 0.022,
  lasers: [
    { dist: 849, width: 1.8, alpha: 0.9, fadeLength: 95 },
    { dist: 766, width: 2, alpha: 1, fadeLength: 260 },
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
  rest: [0.9, 0.2],
};
