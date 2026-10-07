import type { ComponentType, SVGProps } from "react";
import {
  ChatGearIcon,
  GearBulbIcon,
  GearClusterIcon,
  GearIcon,
  LayersIcon,
  PeopleIcon,
  ProgressIcon,
  SitemapIcon,
} from "@/app/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type Layer = { label: string; icon: Icon };
export type Area = { title: string; description: string; icon: Icon };

// The stack card, top to bottom
export const LAYERS: Layer[] = [
  { label: "People", icon: PeopleIcon },
  { label: "Process", icon: ProgressIcon },
  { label: "Systems", icon: GearIcon },
  { label: "Technology", icon: LayersIcon },
];

export const AREAS: Area[] = [
  {
    title: "Website Infrastructure",
    description: "Digital entry points and custom platforms.",
    icon: GearClusterIcon,
  },
  {
    title: "Back-Office Operations",
    description: "The people and recurring workflows behind execution.",
    icon: GearBulbIcon,
  },
  {
    title: "ERP & Systems",
    description: "Data, automation, process and core business platforms.",
    icon: SitemapIcon,
  },
  {
    title: "AdTech",
    description: "Campaign operations, QA and performance infrastructure.",
    icon: ChatGearIcon,
  },
];
