export type B2bPoint = {
  title: string;
  /** The description as the design breaks it; the lines are forced on wide screens and flow as one paragraph below */
  lines: string[];
};

export const B2B_POINTS: B2bPoint[] = [
  {
    title: "Longer buying journeys",
    lines: ["Content, tracking and integrations need to support complex", "decision paths."],
  },
  {
    title: "Multiple internal teams",
    lines: ["Publishing and platform management should not create unnecessary", "technical dependency."],
  },
  {
    title: "Connected business systems",
    lines: ["CRM, analytics, APIs and internal platforms need a cleaner", "relationship with the website."],
  },
];
