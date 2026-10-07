import type { StaticImageData } from "next/image";
import Snaillia from "@/public/images/Case Study/Case_1.png";
import Nextgen from "@/public/images/Case Study/Case_2.png";

// The Case Studies page filter tabs, in order (the "All" tab is added by the list)
export const CASE_STUDY_CATEGORIES = [
  "Website Infrastructure",
  "Back-office",
  "ERP & Systems",
  "AdTech",
] as const;

export type CaseStudyCategory = (typeof CASE_STUDY_CATEGORIES)[number];

export type CaseStudyStat = { value: string; label: string };

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
  /** Case Studies page only: the filter tab it appears under, and the left panel */
  category: CaseStudyCategory;
  challenge: string;
  tags: string[];
  /** Four results, shown 2×2 */
  stats: CaseStudyStat[];
};

const SNAILLIA_COPY = {
  title: "Snaillia",
  summary: "Rebuilding a digital platform for speed, scale and easier management.",
  client: "Snaillia",
  service: "Website Infrastructure",
  description:
    "A complete website infrastructure overhaul focused on improving performance, long-term maintainability, and overall reliability, while creating a cleaner, more efficient publishing workflow that gives internal teams greater control over content, updates, and day-to-day website management.",
  href: "#case-studies",
  category: "Website Infrastructure",
  challenge:
    "Legacy infrastructure was slowing publishing, limiting flexibility and creating unnecessary maintenance overhead.",
  tags: ["CMS", "Performance", "API Integrations", "Platform Architecture"],
  stats: [
    { value: "XX%", label: "Performance improvement" },
    { value: "XX%", label: "Faster publishing workflow" },
    { value: "XX", label: "Systems connected" },
    { value: "XX+", label: "Pages migrated improved" },
  ],
} satisfies Omit<CaseStudy, "id" | "image" | "imageAlt">;

// Copy matches the designs, where every card reuses the Snaillia text and placeholder results (see MEMORY.md open items)
export const CASE_STUDIES: CaseStudy[] = [
  { id: "case-snaillia", ...SNAILLIA_COPY, image: Snaillia, imageAlt: "Snaillia skincare website homepage" },
  { id: "case-nextgen", ...SNAILLIA_COPY, image: Nextgen, imageAlt: "Nextgen fashion store homepage" },
  { id: "case-snaillia-2", ...SNAILLIA_COPY, image: Snaillia, imageAlt: "Snaillia skincare website homepage" },
];
