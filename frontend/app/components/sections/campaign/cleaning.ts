import type { FaqItem } from "../shared/faq/faq";
import type { ProvenStat } from "../shared/proven/proven";

// Cleaning-sector landing page copy that several sections share. The figures are the site's existing, owner-verified ones.
export const CLEANING_STATS: ProvenStat[] = [
  {
    label: "Years of experience",
    description: "Experience across website development, business systems, and operational support.",
    value: "5+",
  },
  {
    label: "Businesses supported",
    description: "Helping business teams improve the tools and processes behind their work.",
    value: "50+",
  },
  {
    label: "Client retention rate",
    description: "Ongoing relationships supported by consistent delivery and communication.",
    value: "95+",
  },
  {
    label: "Systems delivered",
    description: "Websites, integrations, and internal tools delivered for real business needs.",
    value: "25+",
  },
];

export const CLEANING_FAQS: FaqItem[] = [
  {
    question: "Can you improve our existing cleaning company website?",
    answer:
      "Yes. We review the current website and agree whether targeted improvements, integrations, or a rebuild best fit your requirements.",
  },
  {
    question: "Can you work with our existing CRM and business software?",
    answer:
      "We assess the tools you use, available integrations, data, and access requirements before recommending a configuration or connection.",
  },
  {
    question: "Do you provide ongoing maintenance and back-office support?",
    answer:
      "Yes. Website maintenance and recurring administrative support can be scoped around agreed responsibilities, working hours, communication, and reporting.",
  },
  {
    question: "Can you add chatbots, time tracking, or employee check-in?",
    answer:
      "Yes. We can assess these requirements and recommend a suitable tool or custom implementation. Users, permissions, workflows, and reporting are defined before work begins.",
  },
  {
    question: "What happens before development or support starts?",
    answer:
      "We discuss the requirement, review the current setup, and agree the scope, deliverables, dependencies, timeline, and pricing before starting.",
  },
  {
    question: "What if we are unsure which solution we need?",
    answer:
      "Start with the process that is difficult to manage. We will help identify whether the next step is a website improvement, a connected system, an internal tool, or ongoing support.",
  },
];
