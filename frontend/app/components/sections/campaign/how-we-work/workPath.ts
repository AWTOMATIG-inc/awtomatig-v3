export type WorkStep = {
  title: string;
  /** The description as the design breaks it; the lines are forced from `xl` up and flow as one paragraph below */
  lines: string[];
};

export const WORK_STEPS: WorkStep[] = [
  { title: "Discover", lines: ["Understand the problem,", "business environment", "and requirements."] },
  { title: "Audit & Mapping", lines: ["Review what exists and", "map systems, workflows", "and dependencies."] },
  { title: "Solution Design", lines: ["Define the architecture,", "workflow or operating", "model."] },
  { title: "Implementation", lines: ["Build, configure,", "integrate & operationalize", "the solution."] },
  { title: "QA & Delivery", lines: ["Test the environment", "and move it into", "production."] },
  { title: "Optimization & Support", lines: ["Continue improving where", "ongoing involvement is", "required."] },
];
