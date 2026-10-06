export type StepTheme = "white" | "mist" | "fade" | "dark";

export type Step = { title: string; description: string; theme: StepTheme };

export const STEPS: Step[] = [
  {
    title: "Discover.",
    description: "We begin by understanding the business, current systems, people, and operational friction points.",
    theme: "white",
  },
  {
    title: "Design.",
    description: "We map the right structure across workflows, systems, user journeys, and operational requirements.",
    theme: "mist",
  },
  {
    title: "Deliver.",
    description: "We implement, launch, and operationalize the solution with clarity, quality control, and disciplined execution.",
    theme: "fade",
  },
  {
    title: "Improve.",
    description: "We support, refine, and optimize the system as the business and its operations continue to evolve.",
    theme: "dark",
  },
];

// Full class strings per slide surface so Tailwind can detect them. The slides share one story: the page goes from
// white through off-white and a left-to-right fade into charcoal. `base` is the fill, `shade` an optional radial
// darkening, `ribs` the fluted bars (see the `ribs` utilities), `numeral` the oversized step number.
export const STEP_THEMES: Record<
  StepTheme,
  { base: string; shade?: string; ribs: string; numeral: string; text: string; dot: string }
> = {
  white: {
    base: "bg-surface",
    shade: "bg-radial-[ellipse_76%_85%_at_50%_100%] from-black/3 to-transparent",
    ribs: "ribs-dark text-black/3",
    numeral: "text-black/1",
    text: "text-fg-strong",
    dot: "border-black/12",
  },
  mist: {
    base: "bg-surface-subtle",
    ribs: "ribs text-white/30",
    numeral: "text-white/30",
    text: "text-fg-strong",
    dot: "border-black/12",
  },
  fade: {
    // Off-white to charcoal; the fade starts 6% in and its end stop sits past 100%, so the right edge is still a touch lighter than the next slide
    base: "bg-linear-to-r from-off-white from-6% to-surface-inverse to-105%",
    ribs: "ribs-dark text-black/3",
    numeral: "text-white/3",
    text: "text-fg-strong",
    dot: "border-black/12",
  },
  dark: {
    base: "bg-surface-inverse",
    ribs: "ribs text-white/4",
    numeral: "text-white/4",
    text: "text-fg-inverse",
    dot: "border-white/20",
  },
};
