import type { ComponentType, SVGProps } from "react";
import { GearIcon, LayersIcon, PeopleIcon, ProgressIcon } from "@/app/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type Pillar = { title: string; description: string; icon: Icon };

export const PILLARS: Pillar[] = [
  { title: "People", description: "Operators, managed teams, support and ownership.", icon: PeopleIcon },
  { title: "Process", description: "Tasks, workflows, QA, approvals and operational handoffs.", icon: ProgressIcon },
  { title: "Systems", description: "CRM, ERP, CMS, DSP and connected business platforms.", icon: GearIcon },
  { title: "Technology", description: "Automation, APIs, infrastructure, monitoring and reporting.", icon: LayersIcon },
];

export type Problem = { title: string; description: string; mockup: "systems" | "workflows" | "visibility" };

export const PROBLEMS: Problem[] = [
  {
    title: "Disconnected systems",
    description: "Too many systems. Not enough connection. Information gets duplicated, delayed or lost between tools.",
    mockup: "systems",
  },
  {
    title: "Manual workflows",
    description: "Repeated human handoffs slow down routine work and create more opportunities for inconsistency.",
    mockup: "workflows",
  },
  {
    title: "Limited visibility",
    description: "Operations shouldn’t require guesswork. Teams need clear status, ownership and reporting.",
    mockup: "visibility",
  },
];
