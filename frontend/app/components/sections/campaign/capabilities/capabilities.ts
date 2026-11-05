import type { Capability } from "../../shared/capability-list/CapabilityList";
import showcase from "@/public/images/landing_page/web.png";

// Every item shows the same showcase for now. To give an item its own picture, import it above and set `image` and `imageAlt`.
const PLACEHOLDER_ALT = "Example website pages: a homepage, a footer and statistics blocks, shown as a visual placeholder";

export const CAPABILITIES: Capability[] = [
  {
    title: "Cleaning Company Websites",
    description:
      "Improve or rebuild your website with clear service pages, usable quote forms, and straightforward content management.",
    image: showcase,
    imageAlt: PLACEHOLDER_ALT,
  },
  {
    title: "Quote Forms & Chatbots",
    description: "Capture enquiries, answer approved common questions, and route requests to the right person or system.",
    image: showcase,
    imageAlt: PLACEHOLDER_ALT,
  },
  {
    title: "CRM Setup & Integrations",
    description: "Organize contact records and connect enquiry forms, sales stages, and follow-up tasks.",
    image: showcase,
    imageAlt: PLACEHOLDER_ALT,
  },
  {
    title: "Staff Check-In & Time Tracking",
    description: "Configure or build tools for attendance, job-linked time records, and manager review.",
    image: showcase,
    imageAlt: PLACEHOLDER_ALT,
  },
  {
    title: "Internal Portals & Tickets",
    description: "Give staff a clear place to submit requests, track issues, and access relevant information.",
    image: showcase,
    imageAlt: PLACEHOLDER_ALT,
  },
  {
    title: "ERP & Workflow Automation",
    description: "Connect suitable business processes and automate agreed steps across your existing tools.",
    image: showcase,
    imageAlt: PLACEHOLDER_ALT,
  },
  {
    title: "Back-Office & CRM Support",
    description: "Support recurring CRM updates, enquiry follow-ups, record maintenance, and administrative coordination.",
    image: showcase,
    imageAlt: PLACEHOLDER_ALT,
  },
  {
    title: "Hosting, Maintenance & Support",
    description: "Keep your website and agreed systems maintained, monitored, and supported as requirements change.",
    image: showcase,
    imageAlt: PLACEHOLDER_ALT,
  },
];
