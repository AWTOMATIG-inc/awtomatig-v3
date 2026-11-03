export type Problem = { title: string; description: string; mockup: "systems" | "visibility" | "workflows" | "ownership" };

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
