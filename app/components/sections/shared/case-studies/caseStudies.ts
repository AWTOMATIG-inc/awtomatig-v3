import type { StaticImageData } from "next/image";
import type { ServiceId } from "@/lib/services";
import Snaillia from "@/public/images/Case Study/Case_1.png";
import NextgenShowcase from "@/public/images/Case Study/Case_2.png";

export type CaseStudyStat = { value: string; label: string };

export type CaseStudy = {
  id: string;
  title: string;
  summary: string;
  client: string;
  /** The service shown in the "Service:" row; resolved to its name through lib/services.ts */
  service: ServiceId;
  description: string;
  /** Detail page; the "View case study" button is shown only once it exists */
  href?: string;
  /** 551×525 showcase, rounded frame baked into the PNG */
  image: StaticImageData;
  imageAlt: string;
  /** Case Studies page only: the filter tab it appears under, and the left panel */
  category: ServiceId;
  challenge: string;
  tags: string[];
  /** Four results, shown 2×2; left out until real figures exist */
  stats?: CaseStudyStat[];
};

// The design repeats the Snaillia copy under two other showcase images (`Case_2.png`, Nextgen, and Case_1.png again)
// with no distinct text of their own; kept here to match the design exactly (requested 2026-10-09) until the real
// Nextgen case study copy and figures replace the second and third entries.
const SNAILLIA_COPY = {
  title: "Snaillia",
  summary: "Rebuilding a digital platform for speed, scale and easier management.",
  client: "Snaillia",
  service: "website-infrastructure",
  description:
    "A complete website infrastructure overhaul focused on improving performance, long-term maintainability, and overall reliability, while creating a cleaner, more efficient publishing workflow that gives internal teams greater control over content, updates, and day-to-day website management.",
  category: "website-infrastructure",
  challenge: "Legacy infrastructure was slowing publishing, limiting flexibility and creating unnecessary maintenance overhead.",
  tags: ["CMS", "Performance", "API Integrations", "Platform Architecture"],
  // Demo figures (requested 2026-10-09) until the real results replace them; kept as "XX" so they still read as
  // placeholders rather than real numbers, per the project's rule against shipping fake data as if it were real.
  stats: [
    { value: "XX%", label: "Performance improvement" },
    { value: "XX%", label: "Faster publishing workflow" },
    { value: "XX", label: "Systems connected" },
    { value: "XX+", label: "Pages migrated improved" },
  ],
} satisfies Omit<CaseStudy, "id" | "image" | "imageAlt">;

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "case-snaillia",
    ...SNAILLIA_COPY,
    image: Snaillia,
    imageAlt: "Snaillia skincare website homepage",
    href: "/case-studies/case-snaillia",
  },
  {
    id: "case-snaillia-2",
    ...SNAILLIA_COPY,
    image: NextgenShowcase,
    imageAlt: "Fashion storefront website homepage",
    href: "/case-studies/case-snaillia-2",
  },
  {
    id: "case-snaillia-3",
    ...SNAILLIA_COPY,
    image: Snaillia,
    imageAlt: "Snaillia skincare website homepage",
    href: "/case-studies/case-snaillia-3",
  },
];
