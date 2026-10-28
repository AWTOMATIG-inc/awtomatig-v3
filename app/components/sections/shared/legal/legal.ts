import { SITE } from "@/lib/site";

export type LegalDocument = {
  eyebrow: string;
  title: string;
  /** ISO date, shown as "Last updated" */
  updated: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
};

// First drafts written from what the site does today (no accounts; GA4 + Clarity via GTM; the inquiry form opens the
// visitor's email app). They must be reviewed by the owner / legal before launch and updated when the form gets a backend.

export const PRIVACY_POLICY: LegalDocument = {
  eyebrow: "Legal",
  title: "Privacy Policy",
  updated: "2026-10-28",
  intro: `This policy explains what personal information ${SITE.name} receives through this website and how we use it.`,
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        `${SITE.name} builds, connects and operates the systems behind businesses: websites, back-office operations, ERP and business systems, and AdTech. You can reach us at ${SITE.email}.`,
      ],
    },
    {
      heading: "What we collect",
      paragraphs: [
        "This website has no user accounts and no advertising.",
        'We use Google Analytics and Microsoft Clarity, loaded through Google Tag Manager, to understand how visitors use the site: which pages are viewed, how people move between them, and anonymised recordings of clicks and scrolling. They only set cookies if you accept them in the cookie banner; if you reject them, or until you choose, they collect no cookies and only cookieless measurement is sent. These services receive technical data such as your IP address, browser and device. We use this only to improve the website. You can change your choice at any time with "Cookie settings" at the bottom of every page.',
        "The project inquiry form on the Contact page does not send anything from the website. When you submit it, it prepares an email in your own email app, which you then choose to send. If you send it, we receive the details you entered (such as your name, work email, company, budget range and project details) and anything you attach.",
        "Like any website, our hosting provider processes technical data such as IP addresses in server logs to deliver and protect the site.",
      ],
    },
    {
      heading: "How we use it",
      paragraphs: [
        "We use the information you send us only to respond to your inquiry, discuss your project and, if we work together, to deliver and manage that work. We do not sell your information or use it for unrelated marketing.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "We keep inquiry emails for as long as they are needed to respond to you and to keep records of our business relationship. You can ask us to delete them at any time.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [`You can ask to see, correct or delete the personal information we hold about you by emailing ${SITE.email}.`],
    },
    {
      heading: "Changes to this policy",
      paragraphs: ["If we change how we handle personal information, we will update this page and its date."],
    },
  ],
};

export const TERMS: LegalDocument = {
  eyebrow: "Legal",
  title: "Terms & Conditions",
  updated: "2026-10-09",
  intro: `These terms apply to your use of the ${SITE.name} website.`,
  sections: [
    {
      heading: "Use of this website",
      paragraphs: [
        "The content on this website is provided for general information about our services. We work to keep it accurate and up to date, but it is not an offer or a guarantee of any specific result.",
      ],
    },
    {
      heading: "Our work together",
      paragraphs: [
        "Any project or service we provide is governed by a separate written agreement. Nothing on this website creates a contract between you and us.",
      ],
    },
    {
      heading: "Intellectual property",
      paragraphs: [
        `The ${SITE.name} name, logo, design and the content of this website belong to ${SITE.name} or are used with permission. Client names, logos and project images belong to their owners.`,
      ],
    },
    {
      heading: "Links to other websites",
      paragraphs: ["We are not responsible for the content or practices of websites we link to."],
    },
    {
      heading: "Liability",
      paragraphs: [
        "To the extent permitted by law, we are not liable for any loss arising from the use of this website or reliance on its content.",
      ],
    },
    {
      heading: "Changes and contact",
      paragraphs: [`We may update these terms from time to time. Questions about them can be sent to ${SITE.email}.`],
    },
  ],
};
