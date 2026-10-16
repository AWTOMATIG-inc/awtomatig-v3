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
  light:
    "transition-[filter,opacity] duration-700 ease-out-quint group-hover:brightness-0 group-hover:invert group-hover:opacity-80",
  cyan: "transition-[filter,opacity] duration-700 ease-out-quint brightness-0 invert opacity-80 group-hover:brightness-100 group-hover:invert-0 group-hover:opacity-100",
};

export const PILLAR_THEMES: Record<PillarTheme, string> = {
  light: "bg-surface text-fg-strong hover:bg-action-primary",
  cyan: "bg-action-primary text-on-action hover:bg-surface",
};
