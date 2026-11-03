export type PanelCopy = {
  title: string;
  subtitle: string;
  /** Pill at the top right (the Operations panel only) */
  badge?: string;
  rows: { label: string; status: string }[];
};

export type Problem = {
  title: string;
  description: string;
  mockup: "systems" | "visibility" | "workflows" | "ownership";
  /** Own wording for the illustration: the chip / step labels, or the panel text. Rows keep their icons and colours. */
  labels?: string[];
  panel?: PanelCopy;
};

export const PROBLEMS: Problem[] = [
  {
    title: "Disconnected systems",
    description: "Too many tools, not enough connection. Information gets lost between systems.",
    mockup: "systems",
  },
  {
    title: "Limited visibility",
    description: "Operations shouldn’t require guesswork. Teams need clear status, ownership and reporting.",
    mockup: "visibility",
  },
  {
    title: "Manual workflows",
    description: "Repeated human handoffs slow down routine work and create more opportunities for inconsistency.",
    mockup: "workflows",
  },
  {
    title: "Unclear ownership",
    description: "When ownership is unclear, small issues linger and routine work slows down.",
    mockup: "ownership",
  },
];
