import type { ComponentType, SVGProps } from "react";
import { GearIcon, LayersIcon, PeopleIcon, ProgressIcon } from "@/app/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type Layer = { label: string; icon: Icon };

// The stack card, top to bottom
export const LAYERS: Layer[] = [
  { label: "People", icon: PeopleIcon },
  { label: "Process", icon: ProgressIcon },
  { label: "Systems", icon: GearIcon },
  { label: "Technology", icon: LayersIcon },
];
