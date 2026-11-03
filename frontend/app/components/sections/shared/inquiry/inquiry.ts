import { MAILTO, SITE } from "@/lib/site";
import { SERVICES } from "@/lib/services";

type ContactDetail = { label: string; value: string; href?: string };

// The WhatsApp row appears once SITE.whatsappUrl is set (the design's number was a placeholder)
export const CONTACT_DETAILS: ContactDetail[] = [
  { label: "Email", value: SITE.email, href: MAILTO },
  ...(SITE.whatsappUrl ? [{ label: "WhatsApp", value: "Message us on WhatsApp", href: SITE.whatsappUrl }] : []),
  { label: "Response", value: "Typically within 1 business day" },
];

export const BUDGETS = ["Under $5k", "$5k – $15k", "$15k – $50k", "$50k+", "Not sure yet"];

export const HELP_OPTIONS = [...SERVICES.map((service) => service.name), "Not sure yet"];

// The campaign page's form (website infrastructure) has its own, shorter list
export const CAMPAIGN_PROJECT_TYPES = ["New build", "Rebuild / Migration", "Integration", "Ongoing support", "Not sure yet"];

// Which form sent the inquiry, shown to the team in the notification email
export const INQUIRY_SOURCES: Record<string, string> = {
  contact: "Contact page",
  "website-infrastructure": "Website Infrastructure page",
};

export const PROJECT_TYPES = [
  "New project",
  "Rebuild / Migration",
  "Integration",
  "Automation / Workflow",
  "Ongoing Support",
  "Not sure yet",
];
