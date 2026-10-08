import type { StaticImageData } from "next/image";
import BroaderCapabilities from "@/public/images/about/broader_capabilities.png";
import ConnectedWorkflow from "@/public/images/about/connected_workflow.png";
import IndividualProblems from "@/public/images/about/individual_problems.png";
import KeepGrowing from "@/public/images/about/keep_growing.png";

export type GrowthStep = {
  title: string;
  description: string;
  image: StaticImageData;
  /** On desktop the photo comes before its text card (first row) or after it (second row) */
  imageFirst: boolean;
};

export const GROWTH_STEPS: GrowthStep[] = [
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
