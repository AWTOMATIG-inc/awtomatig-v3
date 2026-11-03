import { SITE } from "@/lib/site";
import { COLOR, FONT, escapeHtml } from "@/lib/emailLayout";

// The confirmation email a candidate gets after applying. Pure: data in, { subject, html, text } out.
// Its colours, font and escaping come from lib/emailLayout.ts (the one place the token values are copied for mail).

export type ApplicationConfirmation = {
  name: string;
  jobTitle: string;
  jobType: string;
  workMode: string;
  /** Already formatted, e.g. "2 November 2026" */
  appliedOn: string;
  /** Short reference the candidate can quote */
  reference: string;
};

const NEXT_STEPS = [
  ["We read your application", "Our team goes through your details, answers and resume against the role."],
  ["We shortlist", "If your profile fits, you move to the next stage."],
  ["We contact you", "Shortlisted candidates hear from us by email or phone, using the details you gave."],
] as const;

export function renderApplicationConfirmation(data: ApplicationConfirmation): { subject: string; html: string; text: string } {
  const subject = `We received your application: ${data.jobTitle}`.replace(/[\r\n]+/g, " ");
  const e = escapeHtml;
  const rows: [string, string][] = [
    ["Position", data.jobTitle],
    ["Job type", data.jobType],
    ["Work mode", data.workMode],
    ["Applied on", data.appliedOn],
    ["Reference", data.reference],
  ];

  const summary = rows
    .map(
      ([label, value], i) => `
              <tr>
                <td style="padding:12px 0;${i > 0 ? `border-top:1px solid ${COLOR.gray};` : ""}font-family:${FONT};font-size:12px;line-height:16px;letter-spacing:0.5px;text-transform:uppercase;color:${COLOR.muted};width:120px;vertical-align:top;">${e(label)}</td>
                <td style="padding:12px 0;${i > 0 ? `border-top:1px solid ${COLOR.gray};` : ""}font-family:${FONT};font-size:15px;line-height:22px;font-weight:bold;color:${COLOR.black};vertical-align:top;">${e(value)}</td>
              </tr>`,
    )
    .join("");

  const steps = NEXT_STEPS.map(
    ([title, body], i) => `
          <tr>
            <td style="padding:0 16px 20px 0;vertical-align:top;width:28px;font-family:${FONT};font-size:15px;line-height:22px;font-weight:bold;color:${COLOR.black};">${i + 1}.</td>
            <td style="padding:0 0 20px 0;vertical-align:top;font-family:${FONT};font-size:15px;line-height:22px;color:${COLOR.charcoal};"><strong style="color:${COLOR.black};">${e(title)}</strong><br>${e(body)}</td>
          </tr>`,
  ).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${e(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.offWhite};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Thanks for applying for ${e(data.jobTitle)}. Here is what happens next.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.offWhite};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td style="background:${COLOR.charcoal};padding:28px 32px;border-bottom:3px solid ${COLOR.cyan};font-family:${FONT};font-size:20px;line-height:24px;font-weight:bold;letter-spacing:4px;color:${COLOR.white};">AWTOMATIG</td>
        </tr>
        <tr>
          <td style="background:${COLOR.white};padding:36px 32px 12px 32px;">
            <h1 style="margin:0 0 16px 0;font-family:${FONT};font-size:26px;line-height:32px;font-weight:bold;color:${COLOR.black};">Thanks for applying, ${e(data.name)}.</h1>
            <p style="margin:0 0 24px 0;font-family:${FONT};font-size:15px;line-height:24px;color:${COLOR.charcoal};">We received your application for <strong style="color:${COLOR.black};">${e(data.jobTitle)}</strong>. This is a copy of the key details for your records.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.offWhite};border-radius:8px;">
              <tr>
                <td style="padding:8px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${summary}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${COLOR.white};padding:20px 32px 16px 32px;">
            <h2 style="margin:0 0 16px 0;font-family:${FONT};font-size:18px;line-height:24px;font-weight:bold;color:${COLOR.black};">What happens next</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${COLOR.white};padding:0 32px 32px 32px;">
            <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:${COLOR.muted};">You do not need to send anything else. If a detail above is wrong, write to us and quote your reference.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;border-top:1px solid ${COLOR.gray};font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">
            AWTOMATIG &middot; <a href="mailto:${SITE.email}" style="color:${COLOR.muted};">${SITE.email}</a> &middot; <a href="${SITE.url}" style="color:${COLOR.muted};">${SITE.url.replace(/^https?:\/\//, "")}</a><br>
            Please do not email your documents. We will ask if we need anything more.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    `Thanks for applying, ${data.name}.`,
    `We received your application for ${data.jobTitle}. This is a copy of the key details for your records.`,
    rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
    ["What happens next", ...NEXT_STEPS.map(([title, body], i) => `${i + 1}. ${title}: ${body}`)].join("\n"),
    "You do not need to send anything else. If a detail above is wrong, write to us and quote your reference.",
    `AWTOMATIG\n${SITE.email}\n${SITE.url}\nPlease do not email your documents. We will ask if we need anything more.`,
  ].join("\n\n");

  return { subject, html, text };
}
