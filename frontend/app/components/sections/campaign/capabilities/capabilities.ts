import type { Capability } from "../../shared/capability-list/CapabilityList";
import websites from "@/public/images/cleaning-capabilities/01-cleaning-company-websites.webp";
import quoteForms from "@/public/images/cleaning-capabilities/02-quote-forms-chatbots.webp";
import crm from "@/public/images/cleaning-capabilities/03-crm-setup-integrations.webp";
import checkIn from "@/public/images/cleaning-capabilities/04-staff-check-in-time-tracking.webp";
import portals from "@/public/images/cleaning-capabilities/05-internal-portals-tickets.webp";
import erp from "@/public/images/cleaning-capabilities/06-erp-workflow-automation.webp";
import backOffice from "@/public/images/cleaning-capabilities/07-back-office-crm-support.webp";
import hosting from "@/public/images/cleaning-capabilities/08-hosting-maintenance-support.webp";

// One illustration per item (4:3, shown in the 4:3 frame beside the list).
export const CAPABILITIES: Capability[] = [
  {
    title: "Cleaning Company Websites",
    description:
      "Improve or rebuild your website with clear service pages, usable quote forms, and straightforward content management.",
    image: websites,
    imageAlt: "Example cleaning company website on desktop and phone, with a quick enquiry form and service cards",
  },
  {
    title: "Quote Forms & Chatbots",
    description: "Capture enquiries, answer approved common questions, and route requests to the right person or system.",
    image: quoteForms,
    imageAlt: "Example multi-step quote request form beside a chat that passes the enquiry to the quotes team",
  },
  {
    title: "CRM Setup & Integrations",
    description: "Organize contact records and connect enquiry forms, sales stages, and follow-up tasks.",
    image: crm,
    imageAlt: "Example CRM pipeline where a website form enquiry moves through stages from new enquiry to won",
  },
  {
    title: "Staff Check-In & Time Tracking",
    description: "Configure or build tools for attendance, job-linked time records, and manager review.",
    image: checkIn,
    imageAlt: "Example staff check-in on a phone beside a manager's daily attendance table by site and shift",
  },
  {
    title: "Internal Portals & Tickets",
    description: "Give staff a clear place to submit requests, track issues, and access relevant information.",
    image: portals,
    imageAlt: "Example internal portal listing staff requests by site, owner, priority and status",
  },
  {
    title: "ERP & Workflow Automation",
    description: "Connect suitable business processes and automate agreed steps across your existing tools.",
    image: erp,
    imageAlt: "Example job record flowing from approved job to schedule, team, completion and invoice draft",
  },
  {
    title: "Back-Office & CRM Support",
    description: "Support recurring CRM updates, enquiry follow-ups, record maintenance, and administrative coordination.",
    image: backOffice,
    imageAlt: "Example back-office operator view with an enquiry inbox, CRM updates, follow-up tasks and schedule",
  },
  {
    title: "Hosting, Maintenance & Support",
    description: "Keep your website and agreed systems maintained, monitored, and supported as requirements change.",
    image: hosting,
    imageAlt: "Example website care dashboard with site status, backup history, update tasks and a support ticket",
  },
];
