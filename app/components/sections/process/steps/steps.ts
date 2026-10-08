import type { StaticImageData } from "next/image";
import discover from "@/public/images/process/discover.png";
import audit from "@/public/images/process/audit.png";
import mapping from "@/public/images/process/mapping.png";
import solution from "@/public/images/process/solution.png";
import implementation from "@/public/images/process/implementation.png";
import qa from "@/public/images/process/qa.png";
import optimization from "@/public/images/process/optimization.png";
import support from "@/public/images/process/support.png";
import delivery from "@/public/images/process/delivery.png";

export type ProcessStep = {
  name: string;
  title: string;
  description: string;
  tags: string[];
  output: string;
  image: StaticImageData;
};

export const PROCESS_STEPS: ProcessStep[] = [
  {
    name: "Discovery",
    title: "Understand the business and the problem.",
    description:
      "We start by understanding the objectives, stakeholders, workflows, systems and constraints surrounding the engagement.",
    tags: ["Goals", "Stakeholders", "Requirements", "Existing Environment"],
    output: "Shared understanding of the problem.",
    image: discover,
  },
  {
    name: "Audit",
    title: "Understand what already exists.",
    description:
      "We review the current processes, infrastructure, systems and technical environment to identify gaps, dependencies and areas of friction.",
    tags: ["Infrastructure", "Processes", "Systems", "Data", "Performance"],
    output: "A clear view of the current state.",
    image: audit,
  },
  {
    name: "Mapping",
    title: "See how the operation actually works.",
    description:
      "We map how work, information and responsibility move between people, processes and systems so dependencies and bottlenecks become visible.",
    tags: ["Workflows", "Ownership", "Data Flow", "Handoffs", "Dependencies"],
    output: "A visual model of how the operation works today.",
    image: mapping,
  },
  {
    name: "Solution Design",
    title: "Define what needs to change.",
    description:
      "The findings are translated into a practical solution covering architecture, workflows, integrations, automation and implementation priorities.",
    tags: ["Architecture", "Workflow Design", "Integrations", "Automation"],
    output: "A clear blueprint for implementation.",
    image: solution,
  },
  {
    name: "Implementation",
    title: "Turn the plan into a working solution.",
    description:
      "We build, configure, connect and operationalize the agreed solution across the required systems and workflows.",
    tags: ["Build", "Configure", "Integrate", "Automate", "Migrate"],
    output: "A working production-ready solution.",
    image: implementation,
  },
  {
    name: "QA",
    title: "Verify that everything works as intended.",
    description:
      "The solution is tested across functionality, workflow logic, integrations, data movement and real operating scenarios before delivery.",
    tags: ["Functionality", "Integrations", "Data", "Performance", "Workflow Logic"],
    output: "A validated solution ready for delivery.",
    image: qa,
  },
  {
    name: "Optimization",
    title: "Improve performance after real usage begins.",
    description:
      "Once the solution is live, we identify opportunities to improve performance, efficiency, workflows and system behavior.",
    tags: ["Performance", "Efficiency", "Automation", "Reporting"],
    output: "A stronger system based on real use.",
    image: optimization,
  },
  {
    name: "Ongoing Support",
    title: "Keep the environment moving as requirements evolve.",
    description:
      "Where ongoing involvement is required, AWTOMATIG continues to support, maintain, monitor and improve the environment over time.",
    tags: ["Monitoring", "Maintenance", "Support", "Improvements"],
    output: "An operating environment that can continue evolving.",
    image: support,
  },
  {
    name: "Delivery",
    title: "Move the solution into the real operating environment.",
    description:
      "We complete the transition into production and make sure the system, workflow or process is ready for everyday use.",
    tags: ["Launch", "Deployment", "Handover", "Documentation"],
    output: "A solution integrated into everyday operations.",
    image: delivery,
  },
];
