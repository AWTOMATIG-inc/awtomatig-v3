import {
  COLOR,
  detailCard,
  emailButton,
  emailDocument,
  emailIntro,
  escapeHtml,
  mailtoHref,
  messageBlock,
  stepList,
} from "@/lib/emailLayout";

// The two emails every contact inquiry sends, on one template (Contact page and the campaign pages): a confirmation to the
// visitor and a notification to the team. Pure: data in, { subject, html, text } out.

export type InquiryEmailData = {
  name: string;
  email: string;
  company: string;
  /** What they asked about, e.g. "Website Infrastructure" */
  service: string;
  projectType: string;
  /** Only when the form asks for a budget (the Contact form) */
  budget?: string;
  message: string;
  /** Which page the form was on, e.g. "Contact page" (shown to the team only) */
  source: string;
  /** Already formatted, e.g. "3 November 2026, 14:05" (shown to the team only) */
  receivedAt: string;
};

// A subject never carries a line break, whatever the visitor typed
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

// `linkEmail`: the team gets the address as a link; the visitor's own copy shows it as plain text
const rowsFor = (data: InquiryEmailData, linkEmail: boolean) => {
  const rows = [
    { label: "Name", value: data.name },
    { label: "Work email", value: data.email, ...(linkEmail && { href: mailtoHref(data.email) }) },
    ...(data.company ? [{ label: "Company", value: data.company }] : []),
    { label: "Service", value: data.service },
    { label: "Project type", value: data.projectType },
    ...(data.budget ? [{ label: "Budget / range", value: data.budget }] : []),
  ];
  return rows;
};

const plainRows = (data: InquiryEmailData) =>
  rowsFor(data, false)
    .map(({ label, value }) => `${label}: ${value}`)
    .join("\n");

const NEXT_STEPS = [
  ["We read your message", "Someone on the team goes through what you sent."],
  ["We reply", "You hear from us by email, typically within 1 business day."],
  ["We agree the next step", "A short call or the questions we need answered to scope the work."],
] as const;

const firstName = (name: string) => name.split(/\s+/)[0] || name;

/** To the visitor: "we received your inquiry", a copy of what they sent and what happens next. */
export function renderInquiryConfirmation(data: InquiryEmailData): { subject: string; html: string; text: string } {
  const subject = "We received your inquiry";
  const html = emailDocument({
    title: subject,
    preheader: "Thanks for getting in touch. Here is a copy of your inquiry and what happens next.",
    body:
      emailIntro(
        `Thanks for getting in touch, ${firstName(data.name)}.`,
        "We received your inquiry. This is a copy of what you sent us, for your records.",
      ) +
      detailCard(rowsFor(data, false)) +
      messageBlock("Your message", data.message) +
      stepList("What happens next", NEXT_STEPS),
    note: "To add something or correct a detail, just reply to this email.",
  });
  const text = [
    `Thanks for getting in touch, ${firstName(data.name)}.`,
    "We received your inquiry. This is a copy of what you sent us, for your records.",
    plainRows(data),
    `Your message:\n${data.message}`,
    ["What happens next", ...NEXT_STEPS.map(([title, body], i) => `${i + 1}. ${title}: ${body}`)].join("\n"),
    "To add something or correct a detail, just reply to this email.",
    "AWTOMATIG",
  ].join("\n\n");
  return { subject, html, text };
}

/** To the team: a new inquiry with every detail and a one-click reply. Reply-To is also the visitor. */
export function renderInquiryNotification(data: InquiryEmailData): { subject: string; html: string; text: string } {
  const subject = `New inquiry: ${oneLine(data.company || data.name)}`;
  const e = escapeHtml;
  const html = emailDocument({
    title: subject,
    preheader: `${data.name} sent an inquiry about ${data.service}.`,
    body:
      emailIntro(
        "New inquiry",
        `<strong style="color:${COLOR.black};">${e(data.name)}</strong> sent an inquiry from the ${e(data.source)} on ${e(data.receivedAt)}.`,
      ) +
      detailCard(rowsFor(data, true)) +
      messageBlock("Message", data.message) +
      emailButton(`Reply to ${data.name}`, mailtoHref(data.email, "Re: your inquiry to AWTOMATIG")),
    note: "Sent by the website. You can also reply to this email: it goes to the visitor.",
  });
  const text = [
    "New inquiry",
    `${data.name} sent an inquiry from the ${data.source} on ${data.receivedAt}.`,
    plainRows(data),
    `Message:\n${data.message}`,
    "Reply to this email to answer the visitor.",
  ].join("\n\n");
  return { subject, html, text };
}
