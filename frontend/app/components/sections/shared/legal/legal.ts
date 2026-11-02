import { SITE } from "@/lib/site";

export type LegalDocument = {
  eyebrow: string;
  title: string;
  /** ISO date, shown as "Last updated" */
  updated: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
};

// First drafts written from what the site does today (no visitor accounts; GA4 + Clarity via GTM; the inquiry form saves the
// inquiry in the CRM and emails the team and the visitor; job applications are stored in the backend with the resume in a private
// Cloudflare R2 bucket and confirmed by email). They must be reviewed by the owner / legal before launch, and updated whenever
// the site starts collecting or sharing something new (retention is not automatic yet: see frontend/MEMORY.md).

export const PRIVACY_POLICY: LegalDocument = {
  eyebrow: "Legal",
  title: "Privacy Policy",
  updated: "2026-11-02",
  intro: `This policy explains what personal information ${SITE.name} receives through this website, including project inquiries and job applications, and how we use it.`,
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
        "When you send the project inquiry form on the Contact page, the website sends us what you entered: your name, work email, company, budget range, what you need help with, the project type and your message. We save it in our own system, email it to our team, and email you a confirmation with a copy of what you sent.",
        "When you apply for a job on the Careers page, we collect what you enter in the application: your name, email address and phone number, your education and work history, links to your GitHub or LinkedIn profile if you add them, your answers to the questions for that position, and the resume (a PDF) you upload. We also record that you agreed to this policy, and when. Please include only what the application asks for, and nothing you would not want us to hold.",
        "Like any website, our hosting provider processes technical data such as IP addresses in server logs to deliver and protect the site.",
      ],
    },
    {
      heading: "How we use it",
      paragraphs: [
        "We use the information you send us in an inquiry only to respond to you, discuss your project and, if we work together, to deliver and manage that work.",
        "We use the information in a job application only to consider you for the position you applied for and to contact you about it. Our team reads applications in an internal system that only signed-in employees can open, and a resume is opened through a link that expires after a few minutes.",
        "We do not sell your information or use it for unrelated marketing.",
      ],
    },
    {
      heading: "Where it is stored and who handles it",
      paragraphs: [
        "Inquiries and job applications are stored in our own database. Resumes are stored in a private file storage service from Cloudflare that is not open to the public. Confirmation emails are sent through Google's email service. Along with our hosting provider and the analytics services described above, these providers handle information only to provide those services to us, and they may process it in other countries.",
        "We do not share your information with anyone else, except where the law requires it.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "We keep inquiries for as long as they are needed to respond to you and to keep records of our business relationship.",
        "We keep a job application for as long as it is needed to consider it and to keep a record of our hiring. You can ask us to delete your application and resume at any time.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        `You can ask to see, correct or delete the personal information we hold about you, including an inquiry or a job application and its resume, by emailing ${SITE.email}.`,
      ],
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
