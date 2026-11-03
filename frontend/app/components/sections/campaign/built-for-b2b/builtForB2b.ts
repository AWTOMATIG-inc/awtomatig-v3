export type B2bPoint = {
  title: string;
  /** The description as the design breaks it; the lines are forced on wide screens and flow as one paragraph below */
  lines: string[];
};

export const B2B_POINTS: B2bPoint[] = [
  {
    title: "Commercial buying journeys",
    lines: [
      "Help prospective clients understand your services and submit the",
      "information needed for a useful quote conversation.",
    ],
  },
  {
    title: "Office and field teams",
    lines: ["Give managers and staff clearer ways to handle check-ins, time", "records, requests, and task updates."],
  },
  {
    title: "Connected business systems",
    lines: ["Build a practical relationship between your website, CRM, internal", "tools, and administrative workflows."],
  },
];
