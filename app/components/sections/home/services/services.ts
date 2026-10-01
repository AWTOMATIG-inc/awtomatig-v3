import type { StaticImageData } from "next/image";
import type { ButtonVariant } from "@/app/components/ui";
import webImage from "@/public/images/services/web.png";
import backOfficeImage from "@/public/images/services/back_office.png";
import erpImage from "@/public/images/services/erp.png";
import adTechImage from "@/public/images/services/ad_tech.png";

export type ServiceTheme = "light" | "cyan" | "subtle" | "dark";

export type Service = {
  id: string;
  /** Title lines; they break onto separate lines from lg up */
  title: string[];
  description: string;
  /** Listed column by column: the desktop grid flows top-to-bottom in two rows */
  points: string[];
  image: StaticImageData;
  imageAlt: string;
  href: string;
  theme: ServiceTheme;
};

/** Surface colors per card. Full class strings so Tailwind can see them. */
export const SERVICE_THEMES: Record<
  ServiceTheme,
  { card: string; index: string; panel: string; divider: string; button: ButtonVariant }
> = {
  light: {
    card: "bg-surface text-fg-strong",
    index: "text-black/40",
    panel: "bg-surface-subtle",
    divider: "border-border",
    button: "primary",
  },
  cyan: {
    card: "bg-action-primary text-on-action",
    index: "text-black/40",
    panel: "bg-action-primary-bright",
    divider: "border-action-primary",
    button: "dark",
  },
  subtle: {
    card: "bg-surface-subtle text-fg-strong",
    index: "text-black/40",
    panel: "bg-surface",
    divider: "border-border",
    button: "primary",
  },
  dark: {
    card: "bg-surface-deep text-fg-inverse",
    index: "text-white/40",
    panel: "bg-surface-inverse",
    divider: "border-white/12",
    button: "light",
  },
};

// TODO: point `href` at the service pages once they exist (MEMORY.md §4)
export const SERVICES: Service[] = [
  {
    id: "website-infrastructure",
    title: ["Website", "Infrastructure"],
    description: "Build, operate and maintain the digital infrastructure your business depends on.",
    points: [
      "Corporate Websites",
      "Landing Infrastructure",
      "Hosting & Deployment",
      "Performance",
      "Custom Platforms",
      "CMS Development",
      "Maintenance",
      "API Integrations",
    ],
    image: webImage,
    imageAlt: "Website builds: a skincare storefront, a brand landing page and an AI meeting tool homepage",
    href: "#contact",
    theme: "light",
  },
  {
    id: "back-office-operations",
    title: ["Back-Office", "Operations"],
    description: "Structured operational support for the workflows that keep your business moving.",
    points: [
      "CRM Operations",
      "Customer Support",
      "E-commerce Ops",
      "Quality Assurance",
      "Admin Support",
      "Data Management",
      "Vendor Management",
      "Reporting",
    ],
    image: backOfficeImage,
    imageAlt: "Back-office tools: an online store, a task queue, a support inbox and a warranty request dashboard",
    href: "#contact",
    theme: "cyan",
  },
  {
    id: "erp-business-systems",
    title: ["ERP & Business", "Systems"],
    description: "Connect processes, data and systems into a more efficient operating environment.",
    points: [
      "ERP Implementation",
      "Process Mapping",
      "n8n Automation",
      "Internal Tools",
      "CRM Architecture",
      "Workflow Automation",
      "Finance Integrations",
      "Reporting",
    ],
    image: erpImage,
    imageAlt: "Business systems: a finance app, integrations such as HubSpot, n8n and Salesforce, and an operations dashboard",
    href: "#contact",
    theme: "subtle",
  },
  {
    id: "ad-tech",
    title: ["Ad", "Tech"],
    description: "Operational infrastructure and execution support behind modern advertising teams.",
    points: [
      "Campaign Trafficking",
      "Campaign Setup",
      "Tracking QA",
      "Reporting",
      "DSP Operations",
      "Creative QA",
      "Monitoring",
      "Optimization Support",
    ],
    image: adTechImage,
    imageAlt: "Ad campaigns: display creatives for a juice brand and a campaign manager across Google, Meta and TikTok",
    href: "#contact",
    theme: "dark",
  },
];
