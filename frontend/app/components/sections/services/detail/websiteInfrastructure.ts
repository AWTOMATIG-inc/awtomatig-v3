import BroaderCapabilities from "@/public/images/about/broader_capabilities.jpg";
import ConnectedWorkflow from "@/public/images/about/connected_workflow.jpg";
import IndividualProblems from "@/public/images/about/individual_problems.jpg";
import KeepGrowing from "@/public/images/about/keep_growing.jpg";
import showcase from "@/public/images/landing_page/web.png";
import type { BreakdownCard } from "./breakdown/BreakdownSection";
import type { ConnectedItem } from "./ConnectedSection";
import type { FaqItem } from "../../shared/faq/faq";
import type { GridStep } from "../../shared/step-grid/StepGridSection";
import type { WorkStep } from "../../campaign/how-we-work/workPath";
import type { Capability } from "../../shared/capability-list/CapabilityList";
import { AREAS } from "../ecosystem/ecosystem";
import type { Feature } from "../../shared/feature-grid/FeatureGrid";

// "Overview" cards of the Website Infrastructure page: the four service areas (same icons and order as the Services page),
// with this page's own line for Website Infrastructure
export const OVERVIEW_FEATURES: Feature[] = AREAS.map((area, i) =>
  i === 0 ? { ...area, description: "Digital entry points and custom platforms." } : area,
);

const SHOWCASE_ALT = "Example website pages: a homepage, a footer and statistics blocks, shown as a visual placeholder";

// The eight capability areas. Only the first description is in the design; the others are drafts to confirm.
// Every item shows the same showcase for now: give an item its own picture by importing it and setting `image` and `imageAlt`.
export const CAPABILITIES: Capability[] = [
  {
    title: "Corporate & Business Websites",
    description: "Scalable websites built around clarity, performance and long-term maintainability.",
  },
  {
    title: "Custom Web Platforms & Portals",
    description: "Client, partner and staff portals built around your own workflows, with the access rules they need.",
  },
  {
    title: "Landing-Page Infrastructure",
    description: "Fast, measurable landing pages and campaign templates that your team can launch and change safely.",
  },
  {
    title: "CMS Development & Content Systems",
    description: "Content systems that let your team publish and update pages without developer help.",
  },
  {
    title: "Hosting, Deployment & Production",
    description: "Secure hosting, repeatable deployments and a production setup that stays available under load.",
  },
  {
    title: "Maintenance & Engineering Support",
    description: "Ongoing updates, monitoring and engineering support so the site keeps working as needs change.",
  },
  {
    title: "Performance & Technical Optimization",
    description: "Speed, Core Web Vitals, accessibility and technical SEO improvements, measured before and after.",
  },
  {
    title: "API & Third-Party Integrations",
    description: "Connect your website to the CRM, payment, analytics and internal systems it depends on.",
  },
].map((item) => ({ ...item, image: showcase, imageAlt: SHOWCASE_ALT }));

// "How we work": five steps. Columns measured from the design (an even 271 design px pitch, the last one shorter).
export const WORK_COLUMNS = "grid-cols-[minmax(0,271fr)_minmax(0,271fr)_minmax(0,271fr)_minmax(0,271fr)_minmax(0,236fr)]";

export const WORK_STEPS: WorkStep[] = [
  {
    title: "Discover",
    lines: ["Understand the business,", "users, internal teams and what", "the platform needs to support."],
  },
  {
    title: "Audit & Map",
    lines: ["Review architecture, CMS,", "integrations, content,", "performance and technical", "constraints."],
  },
  {
    title: "Design the System",
    lines: ["Define the platform structure,", "content model, technical", "approach and required", "integrations."],
  },
  {
    title: "Build & Launch",
    lines: ["Develop, integrate, test and", "deploy into a production-ready", "environment."],
  },
  {
    title: "Operate & Improve",
    lines: ["Maintain, monitor and optimize", "the infrastructure as business", "requirements evolve."],
  },
];

// "What changes": four outcomes as photos and numbered cards. The photos are the About page's (the design uses the same four).
export const CHANGE_STEPS: GridStep[] = [
  {
    title: "Faster to manage",
    description: "Internal teams can update and operate the platform without unnecessary technical bottlenecks.",
    image: IndividualProblems,
    imageFirst: true,
  },
  {
    title: "More reliable",
    description: "Better technical foundations reduce avoidable issues across hosting, deployment and integrations.",
    image: ConnectedWorkflow,
    imageFirst: true,
  },
  {
    title: "Easier to extend",
    description: "New pages, integrations, campaigns and functionality can be added without rebuilding the foundation.",
    image: BroaderCapabilities,
    imageFirst: false,
  },
  {
    title: "Better connected",
    description: "The website becomes part of the wider business ecosystem rather than an isolated marketing asset.",
    image: KeepGrowing,
    imageFirst: false,
  },
];

// "Connected technology": six cards
export const CONNECTED_ITEMS: ConnectedItem[] = [
  {
    title: "CMS",
    description: "Content systems that make publishing, updates and day-to-day content management easier for internal teams.",
  },
  {
    title: "Hosting / Deploy",
    description:
      "Production environments, deployment workflows and release processes that keep the platform stable and manageable.",
  },
  {
    title: "CRM / ERP",
    description: "Connect customer, operational and business systems so the website works as part of a wider ecosystem.",
  },
  {
    title: "Analytics",
    description: "Track performance, user behavior and business activity with cleaner data and better reporting visibility.",
  },
  {
    title: "Automation",
    description: "Reduce repetitive tasks and support connected workflows between the website and internal systems.",
  },
  {
    title: "APIs / Services",
    description: "Integrate third-party tools, business logic and external services into one connected digital environment.",
  },
];

// FAQs: only the first answer is in the design; the other five are drafts to confirm.
export const FAQS: FaqItem[] = [
  {
    question: "Do you only build new websites?",
    answer:
      "No. Website Infrastructure can include new builds, existing-platform improvements, migrations, performance work, integrations and ongoing engineering support.",
  },
  {
    question: "Can you work with our existing website?",
    answer:
      "Yes. We review the current platform first, then agree whether targeted improvements, a migration or a rebuild best fits your requirements.",
  },
  {
    question: "Do you provide CMS development?",
    answer:
      "Yes. We build and configure content systems so your team can publish and update pages without developer help, with the structure and permissions they need.",
  },
  {
    question: "Can you connect the website to our existing systems?",
    answer:
      "Yes. We assess your CRM, ERP, analytics and other tools, then connect them to the website through the integrations and APIs they support.",
  },
  {
    question: "Do you provide hosting and deployment support?",
    answer:
      "Yes. We can set up and manage production hosting, deployment workflows and release processes that keep the platform stable and manageable.",
  },
  {
    question: "Can you support the website after launch?",
    answer:
      "Yes. We offer ongoing maintenance, monitoring, updates and engineering support, agreed around how your business uses the platform.",
  },
];

// "Where things break down": six problems, each with its own illustration
export const BREAKDOWN_CARDS: BreakdownCard[] = [
  {
    title: "Outdated infrastructure",
    lines: ["Legacy setups become harder to maintain,", "slower to change and increasingly dependent", "on temporary fixes."],
    mockup: "outdated",
  },
  {
    title: "Slow performance",
    lines: ["Heavy pages and inefficient foundations create", "unnecessary friction for users and internal", "teams."],
    mockup: "performance",
  },
  {
    title: "Publishing bottlenecks",
    lines: ["Simple content changes require technical", "involvement and slow down everyday", "marketing activity."],
    mockup: "publishing",
  },
  {
    title: "Disconnected systems",
    lines: ["Forms, CRM, analytics and internal tools", "operate separately instead of working as one", "environment."],
    mockup: "systems",
  },
  {
    title: "Deployment risk",
    lines: ["Manual or inconsistent release", "processes make routine changes harder", "and more fragile."],
    mockup: "deployment",
  },
  {
    title: "Maintenance debt",
    lines: ["Small technical issues accumulate until", "maintaining the platform becomes more", "expensive than improving it."],
    mockup: "maintenance",
  },
];
