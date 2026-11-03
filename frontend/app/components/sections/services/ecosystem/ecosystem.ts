import type { ComponentType, SVGProps } from "react";
import { ChatGearIcon, GearBulbIcon, GearClusterIcon, SitemapIcon } from "@/app/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type Area = { title: string; description: string; icon: Icon };

export const AREAS: Area[] = [
  {
    title: "Website Infrastructure",
    description: "Websites, CMS builds and custom platforms.",
    icon: GearClusterIcon,
  },
  {
    title: "Back-Office Operations",
    description: "The people and recurring workflows behind execution.",
    icon: GearBulbIcon,
  },
  {
    title: "ERP & Business Systems",
    description: "Data, automation, process and core business platforms.",
    icon: SitemapIcon,
  },
  {
    title: "AdTech",
    description: "Campaign operations, QA and performance infrastructure.",
    icon: ChatGearIcon,
  },
];
