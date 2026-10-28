import { PARTNER_LOGOS } from "../../shared/partners/partners";

type ProvenStat = {
  label: string;
  description: string;
  /** e.g. "12+"; a card is shown only once it has a real figure */ value?: string;
};

// Demo "XX+" placeholders, matching the Figma mockup exactly (D50 pattern): replace with real figures when available
export const PROVEN_STATS: ProvenStat[] = [
  { label: "Years of experience", description: "Built through years of technical and operational delivery", value: "5+" },
  { label: "Businesses supported", description: "Helping teams improve the systems behind their operations", value: "50+" },
  { label: "Client retention rate", description: "Long-term relationships built around reliable delivery", value: "95+" },
  { label: "Systems delivered", description: "Connecting platforms, processes and operational workflows", value: "25+" },
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
