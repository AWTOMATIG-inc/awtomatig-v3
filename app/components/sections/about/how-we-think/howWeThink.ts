import { ChatGearIcon, GearClusterIcon, PlugIcon, SitemapIcon } from "@/app/components/icons";
import type { Feature } from "../../shared/feature-grid/FeatureGrid";

export const PRINCIPLES: Feature[] = [
  { title: "Understand first", description: "We start with the problem, not the tool.", icon: GearClusterIcon },
  {
    title: "Connect what matters",
    description: "Systems work better when information can move between them.",
    icon: PlugIcon,
  },
  {
    title: "Build for reality",
    description: "Solutions need to work inside real businesses, not just in diagrams.",
    icon: SitemapIcon,
  },
  { title: "Keep improving", description: "Good systems evolve as the business evolves.", icon: ChatGearIcon },
];
