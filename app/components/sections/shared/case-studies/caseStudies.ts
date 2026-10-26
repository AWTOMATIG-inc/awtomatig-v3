import type { StaticImageData } from "next/image";
import type { ServiceId } from "@/lib/services";
import Snaillia from "@/public/images/Case Study/Case_1.png";
import RST from "@/public/images/Case Study/RST.png";
import PBB from "@/public/images/Case Study/PBB.png";
import NextgenShowcase from "@/public/images/Case Study/Case_2.png";

export type CaseStudyStat = { value: string; label: string };

export type CaseStudy = {
  id: string;
  title: string;
  summary: string;
  /** Detail page meta; the title is the page name (the layout adds the brand). Falls back to `title` / `summary`. */
  seoTitle?: string;
  seoDescription?: string;
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

const ROYAL_SAFARI_COPY = {
  title: "Royal Safari Tours",
  summary: "A tour website and booking dashboard for a Bangladesh travel company.",
  seoTitle: "Royal Safari Tours: Travel Website Case Study",
  seoDescription:
    "How AWTOMATIG built the Royal Safari Tours website and a custom admin dashboard for tour packages, booking requests, hiring and site content.",
  client: "Royal Safari Tours",
  service: "website-infrastructure",
  description:
    "A full build of the Royal Safari Tours website with a custom admin dashboard behind it. Visitors browse tours in Bangladesh and abroad and send booking requests, while the team manages packages, bookings, hiring and site content in one place, without developer help.",
  category: "website-infrastructure",
  challenge: "Present premium tours clearly online and give the team one place to manage packages, bookings and content.",
  tags: ["Next.js", "Admin Dashboard", "Booking Requests", "PostgreSQL"],
  stats: [
    { value: "19", label: "Tour packages online" },
    { value: "5", label: "Countries with live packages" },
    { value: "1", label: "Dashboard for the whole team" },
    { value: "4", label: "Back-office modules" },
  ],
} satisfies Omit<CaseStudy, "id" | "image" | "imageAlt">;

// Written from the live site (powerbankbangladesh.com) and the project repo (README, memory.md, delivery breakdown).
// Counts come from the site and the repo (98 models, 3 document types, 1500 kVA top band, Dhaka and Chattogram as of
// 2026-10-26), not measured results.
const POWER_BANK_COPY = {
  title: "Power Bank Bangladesh",
  summary: "A generator catalog with a dashboard for quotes, invoices and receipts.",
  seoTitle: "Power Bank Bangladesh: Generator Site Case Study",
  seoDescription:
    "How AWTOMATIG built the Power Bank Bangladesh generator catalog with a custom dashboard for quotations, invoices, money receipts and PDF documents.",
  client: "Power Bank Bangladesh",
  service: "back-office-operations",
  description:
    "A generator catalog site with a custom dashboard behind it. Visitors filter 98 models by brand and power, then request a quotation on WhatsApp, while the team manages products, prices, clients, quotations, invoices and money receipts, all as ready-to-send PDFs, without developer help.",
  category: "back-office-operations",
  challenge: "Show a 98-model generator catalog clearly and let the team manage products, quotes and invoices on its own.",
  tags: ["Next.js", "PocketBase", "PDF Generation", "Admin Dashboard"],
  stats: [
    { value: "98", label: "Generator models listed" },
    { value: "3", label: "Document types as PDFs" },
    { value: "1500", label: "kVA top of the range" },
    { value: "2", label: "Locations served" },
  ],
} satisfies Omit<CaseStudy, "id" | "image" | "imageAlt">;

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "royal-safari-tours",
    ...ROYAL_SAFARI_COPY,
    // Placeholder image (Snaillia's) until the Royal Safari showcase is exported
    image: RST,
    imageAlt: "Royal Safari Tours website homepage",
    href: "/case-studies/royal-safari-tours",
  },
  {
    id: "power-bank-bangladesh",
    ...POWER_BANK_COPY,
    // Placeholder image (Nextgen's) until the Power Bank Bangladesh showcase is exported
    image: PBB,
    imageAlt: "Power Bank Bangladesh website homepage",
    href: "/case-studies/power-bank-bangladesh",
  },
];
