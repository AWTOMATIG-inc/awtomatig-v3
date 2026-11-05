import type { SiteMetricKey } from "@/lib/siteMetrics";
import { PARTNER_LOGOS } from "../partners/partners";

export type ProvenStat = {
  label: string;
  description: string;
  /** The figure comes from the admin's Site Metrics (lib/siteMetrics.ts); a card is shown only once it has a figure */
  metric: SiteMetricKey;
};

// The figures are edited in the admin (Website → Site Metrics); only the wording of each card lives here
export const PROVEN_STATS: ProvenStat[] = [
  {
    label: "Years of experience",
    description: "Built through years of technical and operational delivery",
    metric: "years_experience",
  },
  {
    label: "Businesses supported",
    description: "Helping teams improve the systems behind their operations",
    metric: "businesses_supported",
  },
  {
    label: "Client retention rate",
    description: "Long-term relationships built around reliable delivery",
    metric: "client_retention",
  },
  {
    label: "Systems delivered",
    description: "Connecting platforms, processes and operational workflows",
    metric: "systems_delivered",
  },
];

// On hover the colour logos return to their original colours; the two white ones (invisible on off-white) go to full black
// The design shows every logo in grey: coloured logos are desaturated, the two white ones are darkened
const GREY = "grayscale brightness-75 opacity-80 hover:grayscale-0 hover:brightness-100 hover:opacity-100";
const GREY_FROM_WHITE = "brightness-0 opacity-60 hover:opacity-100";
const WHITE_LOGOS = new Set(["We Watch", "Objective Focus"]);

export const PARTNERS = PARTNER_LOGOS.map((partner) => ({
  ...partner,
  tone: WHITE_LOGOS.has(partner.name) ? GREY_FROM_WHITE : GREY,
}));
