import type { LinesPreset } from "@/app/components/ui";

// Contact hero background: the light page's faint white bars (a 108 design px pitch, strongest at the top and fading
// out downwards), now animated by the shared LinesBackground engine. Vertical lines, no lasers.
export const CONTACT_LINES: LinesPreset = {
  background: "var(--color-off-white)",
  angleDeg: 90,
  bandPeriod: 108,
  bandAlpha: 0.5,
  lasers: [],
  // Full strength along the top edge, gone by the bottom: a very wide ellipse is a horizontal-only fade
  mask: {
    rx: 8,
    ry: 1,
    origin: [0.5, 0],
    stops: [
      [0, 1],
      [0.95, 0],
      [1, 0],
    ],
  },
  rest: [0.7, 0.2],
};
