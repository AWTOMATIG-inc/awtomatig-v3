import type { ReactNode } from "react";

export type PillarTheme = "light" | "cyan";

export type Pillar = {
  id: string;
  eyebrow: string;
  /** Use `<br className="max-lg:hidden" />` for the desktop line breaks */
  title: ReactNode;
  description: ReactNode;
  theme: PillarTheme;
};

// Full class strings so Tailwind can detect them
// The brand mark is cyan, so on the cyan card it is tinted white
export const PILLAR_MARKS: Record<PillarTheme, string> = {
  light: "",
  cyan: "brightness-0 invert opacity-80",
};

export const PILLAR_THEMES: Record<PillarTheme, string> = {
  light: "bg-surface text-fg-strong",
  cyan: "bg-action-primary text-on-action",
};
