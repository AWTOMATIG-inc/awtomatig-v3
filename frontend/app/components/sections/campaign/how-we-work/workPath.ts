export type WorkStep = {
  title: string;
  /** The description as the design breaks it; the lines are forced from `xl` up and flow as one paragraph below. Keep each
   *  line to about 24 characters (22 for the narrow columns) so it stays inside its column, and give every step the same
   *  number of lines (four) so the row has one height. */
  lines: string[];
};

export const WORK_STEPS: WorkStep[] = [
  {
    title: "Discover",
    lines: ["Understand your cleaning", "business, current", "priorities, team, and", "requirements."],
  },
  {
    title: "Audit & Mapping",
    lines: ["Review existing tools", "and map how information,", "tasks, and", "responsibilities move."],
  },
  {
    title: "Scope & Design",
    lines: ["Agree the solution,", "deliverables,", "responsibilities,", "timeline, and pricing."],
  },
  {
    title: "Implementation",
    lines: ["Build, configure, or", "connect the agreed", "website, systems, and", "workflows."],
  },
  {
    title: "QA & Handover",
    lines: ["Test the agreed", "workflow and", "prepare your team", "to use it."],
  },
  {
    title: "Support & Improvement",
    lines: ["Provide agreed", "maintenance, operational", "support, or further", "improvements."],
  },
];
