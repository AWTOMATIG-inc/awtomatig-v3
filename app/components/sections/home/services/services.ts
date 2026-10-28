import type { StaticImageData } from "next/image";
import type { ButtonVariant } from "@/app/components/ui";
import { SERVICES as SERVICE_REGISTRY, type ServiceId } from "@/lib/services";
import webImage from "@/public/images/services/web.png";
import backOfficeImage from "@/public/images/services/back_office.png";
import erpImage from "@/public/images/services/erp.png";
import adTechImage from "@/public/images/services/ad_tech.png";

export type ServiceTheme = "light" | "cyan" | "subtle" | "dark";

export type ServiceContent = {
  /** Title lines; they break onto separate lines from lg up */
  title: string[];
  description: string;
  /** Listed column by column: the desktop grid flows top-to-bottom in two rows */
  points: string[];
  image: StaticImageData;
  imageAlt: string;
  theme: ServiceTheme;
};

export type Service = ServiceContent & { id: ServiceId };

/** Surface colors per card. Full class strings so Tailwind can see them. */
export const SERVICE_THEMES: Record<
  ServiceTheme,
  { card: string; index: string; panel: string; divider: string; button: ButtonVariant }
> = {
  light: {
    card: "bg-surface text-fg-strong",
    index: "text-black/60",
    panel: "bg-surface-subtle",
    divider: "border-border",
    button: "primary",
  },
  cyan: {
    card: "bg-action-primary text-on-action",
    index: "text-black/60",
    panel: "bg-action-primary-bright",
    divider: "border-action-primary",
    button: "dark",
  },
  subtle: {
    card: "bg-surface-subtle text-fg-strong",
    index: "text-black/60",
    panel: "bg-surface",
    divider: "border-border",
    button: "primary",
  },
  dark: {
    card: "bg-surface-deep text-fg-inverse",
    index: "text-white/60",
    panel: "bg-surface-inverse",
    divider: "border-white/12",
    button: "light",
  },
};

// Presentation only, keyed by the registry's ids: `satisfies` fails to build if a service is missing or
// an unknown id is added here, so this and lib/services.ts can never drift apart.
const SERVICE_CONTENT = {
  "website-infrastructure": {
    title: ["Website", "Infrastructure"],
    description: "Website development, hosting and upkeep for the platforms your business relies on.",
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
    imageAlt: "Website development examples: a skincare storefront, a brand landing page and an AI meeting tool homepage",
    theme: "light",
  },
  "back-office-operations": {
    title: ["Back-Office", "Operations"],
    description: "Managed back-office support for the daily workflows that keep your business moving.",
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
    imageAlt: "Back-office operations tools: an online store, a task queue, a support inbox and a warranty request dashboard",
    theme: "cyan",
  },
  "erp-business-systems": {
    title: ["ERP & Business", "Systems"],
    description: "ERP implementation and automation that connects your data, processes and systems.",
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
    imageAlt:
      "ERP and business systems: a finance app, integrations such as HubSpot, n8n and Salesforce, and an operations dashboard",
    theme: "subtle",
  },
  "ad-tech": {
    title: ["Ad", "Tech"],
    description: "AdTech operations, campaign trafficking and QA behind modern advertising teams.",
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
    imageAlt:
      "AdTech campaign operations: display creatives for a juice brand and a campaign manager across Google, Meta and TikTok",
    theme: "dark",
  },
} satisfies Record<ServiceId, ServiceContent>;

// In registry order (Website Infrastructure, Back-Office Operations, ERP & Business Systems, AdTech)
export const SERVICES: Service[] = SERVICE_REGISTRY.map(({ id }) => ({ id, ...SERVICE_CONTENT[id] }));
