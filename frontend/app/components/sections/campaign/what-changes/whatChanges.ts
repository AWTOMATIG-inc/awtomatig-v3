import { ChatGearIcon, GearBulbIcon, GearClusterIcon, SitemapIcon } from "@/app/components/icons";
import type { Feature } from "../../shared/feature-grid/FeatureGrid";

export const OUTCOMES: Feature[] = [
  {
    title: "Clearer workflows",
    description: "Give enquiries, internal requests, and routine tasks a defined next step and responsible owner.",
    icon: GearClusterIcon,
  },
  {
    title: "Better visibility",
    description: "Make agreed records, work status, and reporting easier for the right people to access.",
    icon: GearBulbIcon,
  },
  {
    title: "Less manual work",
    description: "Reduce avoidable duplicate entry through suitable integrations and workflow automation.",
    icon: SitemapIcon,
  },
  {
    title: "Room to grow",
    description: "Adapt your website, systems, and support as service areas, staff, and client requirements expand.",
    icon: ChatGearIcon,
  },
];
