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
