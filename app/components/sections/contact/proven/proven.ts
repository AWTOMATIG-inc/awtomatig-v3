import SmithLake from "@/public/images/partners/partner-2.png";
import NoSpainNoGain from "@/public/images/partners/partner-3.png";
import SellMyRig from "@/public/images/partners/partner-4.png";
import WLogo from "@/public/images/partners/partner-5.png";
import ObjectiveFocus from "@/public/images/partners/partner-6.png";
import ExpandB2B from "@/public/images/partners/partner-7.png";
import Zenithics from "@/public/images/partners/partner-1.png";

// Placeholder figures until the real numbers are supplied
export const PROVEN_STATS = [
  { label: "Years of experience", value: "XX+", description: "Built through years of technical and operational delivery" },
  { label: "Businesses supported", value: "XX+", description: "Helping teams improve the systems behind their operations" },
  { label: "Client retention rate", value: "XX+", description: "Long-term relationships built around reliable delivery" },
  { label: "Systems delivered", value: "XX+", description: "Connecting platforms, processes and operational workflows" },
];

// On hover the colour logos return to their original colours; the two white ones (invisible on off-white) go to full black
// `height` is the 1440 design height as a full class, shown from lg (logo widths follow their aspect); the design shows every logo in grey: coloured logos are desaturated, the two white ones are darkened
const GREY = "grayscale brightness-75 opacity-80 hover:grayscale-0 hover:brightness-100 hover:opacity-100";
const GREY_FROM_WHITE = "brightness-0 opacity-60 hover:opacity-100";

export const PARTNERS = [
  { name: "The Smith Lake Life", height: "lg:h-62", logo: SmithLake, tone: GREY },
  { name: "No Spain No Gain", height: "lg:h-57", logo: NoSpainNoGain, tone: GREY },
  { name: "Sell My Rig", height: "lg:h-59", logo: SellMyRig, tone: GREY },
  { name: "W.", height: "lg:h-67", logo: WLogo, tone: GREY_FROM_WHITE },
  { name: "Objective Focus", height: "lg:h-31", logo: ObjectiveFocus, tone: GREY_FROM_WHITE },
  { name: "Expand B2B", height: "lg:h-54", logo: ExpandB2B, tone: GREY },
  { name: "Zenithics", height: "lg:h-57", logo: Zenithics, tone: GREY },
];
