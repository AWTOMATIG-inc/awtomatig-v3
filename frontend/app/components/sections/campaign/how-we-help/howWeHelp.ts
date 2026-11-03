import { ChatGearIcon, GearBulbIcon, GearClusterIcon, SitemapIcon } from "@/app/components/icons";
import type { Feature } from "../../shared/feature-grid/FeatureGrid";

export const HELP_STEPS: Feature[] = [
  {
    title: "Build",
    description:
      "Develop the website, internal portal, or business tool your cleaning team needs, with a defined scope and clear handover.",
    icon: GearClusterIcon,
  },
  {
    title: "Connect",
    description:
      "Link website forms, CRM records, and suitable third-party tools so information moves through an agreed workflow.",
    icon: GearBulbIcon,
  },
  {
    title: "Operate",
    description: "Assign recurring CRM updates, enquiry follow-ups, and administrative tasks to an accountable support team.",
    icon: SitemapIcon,
  },
  {
    title: "Improve",
    description: "Refine performance, reporting, and automation as your team learns what works and requirements evolve.",
    icon: ChatGearIcon,
  },
];
