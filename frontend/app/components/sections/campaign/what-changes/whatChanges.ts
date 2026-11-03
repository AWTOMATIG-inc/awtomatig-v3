import { ChatGearIcon, GearBulbIcon, GearClusterIcon, SitemapIcon } from "@/app/components/icons";
import type { Feature } from "../../shared/feature-grid/FeatureGrid";

export const OUTCOMES: Feature[] = [
  {
    title: "Clearer workflows",
    description: "Teams understand how work moves and who owns each step.",
    icon: GearClusterIcon,
  },
  {
    title: "Better visibility",
    description: "Systems & reporting make the operating picture easier to understand.",
    icon: GearBulbIcon,
  },
  {
    title: "Less manual work",
    description: "Connected systems reduce repetitive tasks and unnecessary handoffs.",
    icon: SitemapIcon,
  },
  {
    title: "Easier to scale",
    description: "A stronger foundation can support new requirements with less complexity.",
    icon: ChatGearIcon,
  },
];
