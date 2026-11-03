type Capability = {
  title: string;
  /** Shown under the title of the highlighted (first) item only, as in the design */
  description?: string;
};

export const CAPABILITIES: Capability[] = [
  {
    title: "Corporate & Business Websites",
    description: "Scalable websites built around clarity, performance and long-term maintainability.",
  },
  { title: "Custom Web Platforms & Portals" },
  { title: "Landing-Page Infrastructure" },
  { title: "CMS Development & Content Systems" },
  { title: "Hosting, Deployment & Production" },
  { title: "Maintenance & Engineering Support" },
  { title: "Performance & Technical Optimization" },
  { title: "API & Third-Party Integrations" },
];
