import type { StaticImageData } from "next/image";
import Snaillia from "@/public/images/Case Study/Case_1.png";
import Nextgen from "@/public/images/Case Study/Case_2.png";

export type CaseStudy = {
  id: string;
  title: string;
  summary: string;
  client: string;
  service: string;
  description: string;
  href: string;
  /** 551×525 showcase, rounded frame baked into the PNG */
  image: StaticImageData;
  imageAlt: string;
};

const SNAILLIA_COPY = {
  title: "Snaillia",
  summary: "Rebuilding a digital platform for speed, scale and easier management.",
  client: "Snaillia",
  service: "Website Infrastructure",
  description:
    "A complete website infrastructure overhaul focused on improving performance, long-term maintainability, and overall reliability, while creating a cleaner, more efficient publishing workflow that gives internal teams greater control over content, updates, and day-to-day website management.",
  href: "#case-studies",
};

// Copy matches the design, where all three cards reuse the Snaillia text (placeholder; see MEMORY.md open items)
export const CASE_STUDIES: CaseStudy[] = [
  { id: "case-snaillia", ...SNAILLIA_COPY, image: Snaillia, imageAlt: "Snaillia skincare website homepage" },
  { id: "case-nextgen", ...SNAILLIA_COPY, image: Nextgen, imageAlt: "Nextgen fashion store homepage" },
  { id: "case-snaillia-2", ...SNAILLIA_COPY, image: Snaillia, imageAlt: "Snaillia skincare website homepage" },
];
