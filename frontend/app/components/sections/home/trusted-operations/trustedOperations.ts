import type { SiteMetricKey } from "@/lib/siteMetrics";
import { PARTNER_LOGOS } from "../../shared/partners/partners";
import type { ComponentType, SVGProps } from "react";
import {
  BadgeCheckIcon,
  BriefcaseIcon,
  CardsIcon,
  CloudIcon,
  ChartBarsIcon,
  DatabaseOutlineIcon,
  WindowGearIcon,
} from "@/app/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

// The figures are edited in the admin (Website → Site Metrics); only the label and icon of each row live here
export const RESULTS: { metric: SiteMetricKey; label: string; icon: Icon }[] = [
  { metric: "businesses_supported", label: "Businesses Supported", icon: BriefcaseIcon },
  { metric: "systems_delivered", label: "Systems & Workflows delivered", icon: BadgeCheckIcon },
  { metric: "projects_completed", label: "Projects Completed", icon: CardsIcon },
];

// The four ecosystem tiles above the map (decorative)
export const ECOSYSTEM_ICONS: Icon[] = [WindowGearIcon, CloudIcon, ChartBarsIcon, DatabaseOutlineIcon];

// Cyan "connected" dots, in the map's own coordinates (see worldDots.ts: 3px per degree of longitude, 2.375px per degree of latitude)
export const MAP_CITIES: [number, number][] = [
  [282, 95],
  [215, 127],
  [434, 45],
  [346, 204],
  [492, 162],
  [560, 74],
  [572, 162],
  [577, 225],
  [622, 104],
  [715, 65],
  [712, 104],
  [712, 154],
  [777, 57],
];

// Partner logos on the dark backdrop: same hover as Contact (greyscale at rest, original colours on hover)
const GREY = "grayscale brightness-75 opacity-80 hover:grayscale-0 hover:brightness-100 hover:opacity-100";
export const TRUSTED_PARTNERS = PARTNER_LOGOS.map((partner) => ({ ...partner, tone: GREY }));
