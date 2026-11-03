import { ChatGearIcon, GearBulbIcon, GearClusterIcon, SitemapIcon } from "@/app/components/icons";
import type { Feature } from "../../shared/feature-grid/FeatureGrid";

export const HELP_STEPS: Feature[] = [
  {
    title: "Build",
    description: "Create the infrastructure, systems or workflows required to support the business properly.",
    icon: GearClusterIcon,
  },
  {
    title: "Connect",
    description: "Integrate platforms, data and operational processes into a more coherent environment.",
    icon: GearBulbIcon,
  },
  {
    title: "Operate",
    description: "Support the recurring work required to keep the environment moving day to day.",
    icon: SitemapIcon,
  },
  {
    title: "Improve",
    description: "Optimize performance, automation and workflows as requirements evolve.",
    icon: ChatGearIcon,
  },
];
