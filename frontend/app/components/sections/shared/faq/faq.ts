export type FaqItem = { question: string; answer: string };

// Only the first answer comes from the design; the rest are drafts to confirm with the owner
export const FAQS: FaqItem[] = [
  {
    question: "Do you work with existing websites or only new builds?",
    answer:
      "We can work with existing platforms, rebuilds, migrations and new infrastructure depending on what the current environment requires.",
  },
  {
    question: "Can you work with our existing CMS and systems?",
    answer:
      "Yes. We start by understanding the tools you already use, then build around them or connect them, and only replace what is holding the work back.",
  },
  {
    question: "Do you provide ongoing maintenance?",
    answer:
      "Yes. After launch we can support the processes and systems your business relies on, with fixes, updates and improvements as requirements evolve.",
  },
  {
    question: "Can you handle third-party integrations?",
    answer:
      "Yes. We connect websites, back-office tools, ERPs and ad platforms so data moves between them instead of being copied by hand.",
  },
  {
    question: "What happens before development starts?",
    answer:
      "We map the problem first: how the work runs today, where it gets stuck and what a better setup needs. Development starts once that is clear.",
  },
  {
    question: "How do we know what type of project we need?",
    answer:
      "You don’t need a defined solution. Tell us what is getting stuck and we will help identify whether it is a build, an ongoing operation or an improvement.",
  },
];
