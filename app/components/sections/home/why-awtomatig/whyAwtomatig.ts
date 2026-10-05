import type { ComponentType, SVGProps } from "react";
import { ChatGearIcon, GearBulbIcon, GearClusterIcon, SitemapIcon } from "@/app/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type Reason = { title: string; description: string; icon: Icon };

export const REASONS: Reason[] = [
  {
    title: "Systems thinking",
    description: "We look at how technology, workflows and teams interact not just isolated tools.",
    icon: GearClusterIcon,
  },
  {
    title: "Operational execution",
    description: "Solutions are designed around how the work actually happens.",
    icon: GearBulbIcon,
  },
  {
    title: "Technical depth",
    description: "Infrastructure, automation and integrations are treated as connected components.",
    icon: SitemapIcon,
  },
  {
    title: "Long-term support",
    description: "Our role can continue into monitoring, optimization and ongoing operations.",
    icon: ChatGearIcon,
  },
];
