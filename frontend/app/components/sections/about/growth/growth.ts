import type { GridStep } from "../../shared/step-grid/StepGridSection";
import BroaderCapabilities from "@/public/images/about/broader_capabilities.jpg";
import ConnectedWorkflow from "@/public/images/about/connected_workflow.jpg";
import IndividualProblems from "@/public/images/about/individual_problems.jpg";
import KeepGrowing from "@/public/images/about/keep_growing.jpg";

export const GROWTH_STEPS: GridStep[] = [
  {
    title: "Individual problems",
    description: "Started by solving focused problems where businesses needed practical support.",
    image: IndividualProblems,
    imageFirst: true,
  },
  {
    title: "Connected workflows",
    description: "Expanded into the systems and processes surrounding the original problem.",
    image: ConnectedWorkflow,
    imageFirst: true,
  },
  {
    title: "Broader capabilities",
    description: "Built solutions across websites, operations, business systems and technology.",
    image: BroaderCapabilities,
    imageFirst: false,
  },
  {
    title: "Keep growing",
    description: "Continuing to grow the team, capabilities and environments we can support.",
    image: KeepGrowing,
    imageFirst: false,
  },
];
