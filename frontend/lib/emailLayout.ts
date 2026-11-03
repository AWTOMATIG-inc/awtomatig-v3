import { SITE } from "@/lib/site";

// Building blocks for the emails the site sends (candidate confirmation, inquiry confirmation and inquiry notification), so
// they share one look. Pure string builders: data in, HTML out.
//
// DELIBERATE EXCEPTION to "no raw hex": mail clients cannot read CSS variables, so the design tokens are copied here as values,
// each commented with the token it comes from. If a token changes in app/globals.css, change it here too (DESIGN.md §10).
// Layout is a single 600px column of nested tables with inline styles, the only markup every mail client renders alike.
export const COLOR = {
  charcoal: "#1E1E1E", // --color-charcoal (surface-inverse): header, body text
  cyan: "#02D5E8", // --color-cyan (action-primary): the rule under the header and the button, used sparingly
  offWhite: "#F0F0F0", // --color-off-white (surface-subtle): page and detail card
  white: "#FFFFFF", // --color-white (surface): the message body
  gray: "#D9D9D9", // --color-gray (border): hairlines
  black: "#000000", // --color-black (fg-strong): headline and values
  muted: "#484848", // fg-muted (black at 70% over off-white), flattened because mail clients drop alpha
} as const;

// Web fonts are unreliable in mail, so the site's Inter Tight / Inter fall back to system sans-serif.
export const FONT = "Arial, Helvetica, sans-serif";

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** A mailto link for an address the visitor typed: the address is percent-encoded (the @ kept), so it cannot add parameters such as a CC. */
export const mailtoHref = (address: string, subject?: string) =>
  `mailto:${encodeURIComponent(address).replace(/%40/g, "@")}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;

/** Escaped text with its line breaks kept (a visitor's message). */
export const withLineBreaks = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br>");

type EmailDocument = {
  /** The <title> and nothing else: the subject is set by the caller */
  title: string;
  /** The grey preview line some mail apps show next to the subject */
  preheader: string;
  /** HTML inside the white card (headline, text, tables) */
  body: string;
  /** One line under the card, plain text (escaped here) */
  note: string;
};

/** The whole document: charcoal wordmark bar with a cyan rule, the white card with `body`, and the footer. */
export function emailDocument({ title, preheader, body, note }: EmailDocument): string {
  const e = escapeHtml;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${e(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.offWhite};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.offWhite};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;">
        <tr>
          <td style="background:${COLOR.charcoal};padding:28px 32px;border-bottom:3px solid ${COLOR.cyan};border-radius:12px 12px 0 0;font-family:${FONT};font-size:20px;line-height:24px;font-weight:bold;letter-spacing:4px;color:${COLOR.white};">AWTOMATIG</td>
        </tr>
        <tr>
          <td style="background:${COLOR.white};padding:36px 32px 36px 32px;border-radius:0 0 12px 12px;">${body}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 0 32px;font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">
            ${e(note)}<br>
            AWTOMATIG &middot; <a href="mailto:${SITE.email}" style="color:${COLOR.muted};">${SITE.email}</a> &middot; <a href="${SITE.url}" style="color:${COLOR.muted};">${SITE.url.replace(/^https?:\/\//, "")}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Headline and lead paragraph at the top of the card. `lead` is HTML (already escaped by the caller). */
export function emailIntro(headline: string, lead: string): string {
  return `
            <h1 style="margin:0 0 12px 0;font-family:${FONT};font-size:26px;line-height:32px;font-weight:bold;color:${COLOR.black};">${escapeHtml(headline)}</h1>
            <p style="margin:0 0 28px 0;font-family:${FONT};font-size:15px;line-height:24px;color:${COLOR.charcoal};">${lead}</p>`;
}

/** Off-white card of label / value rows split by hairlines. Values are plain text (escaped here); `href` makes one a mailto link. */
export function detailCard(rows: { label: string; value: string; href?: string }[]): string {
  const cells = rows
    .map(({ label, value, href }, i) => {
      const border = i > 0 ? `border-top:1px solid ${COLOR.gray};` : "";
      const text = href
        ? `<a href="${escapeHtml(href)}" style="color:${COLOR.black};text-decoration:underline;">${escapeHtml(value)}</a>`
        : escapeHtml(value);
      return `
                <tr>
                  <td style="padding:12px 0;${border}font-family:${FONT};font-size:12px;line-height:16px;letter-spacing:0.5px;text-transform:uppercase;color:${COLOR.muted};width:130px;vertical-align:top;">${escapeHtml(label)}</td>
                  <td style="padding:12px 0;${border}font-family:${FONT};font-size:15px;line-height:22px;font-weight:bold;color:${COLOR.black};vertical-align:top;">${text}</td>
                </tr>`;
    })
    .join("");
  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.offWhite};border-radius:8px;">
              <tr>
                <td style="padding:8px 20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}
                  </table>
                </td>
              </tr>
            </table>`;
}

/** A small uppercase label over a block of text with its line breaks kept (the visitor's message). */
export function messageBlock(label: string, text: string): string {
  return `
            <p style="margin:28px 0 8px 0;font-family:${FONT};font-size:12px;line-height:16px;letter-spacing:0.5px;text-transform:uppercase;color:${COLOR.muted};">${escapeHtml(label)}</p>
            <p style="margin:0;padding:0 0 0 16px;border-left:3px solid ${COLOR.cyan};font-family:${FONT};font-size:15px;line-height:24px;color:${COLOR.charcoal};">${withLineBreaks(text)}</p>`;
}

/** A cyan button that works in every mail client (a padded link inside a coloured cell). Black text on cyan, as on the site. */
export function emailButton(label: string, href: string): string {
  return `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0 0;">
              <tr>
                <td style="background:${COLOR.cyan};border-radius:8px;">
                  <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 24px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;color:${COLOR.black};text-decoration:none;">${escapeHtml(label)}</a>
                </td>
              </tr>
            </table>`;
}

/** A short numbered list ("What happens next"). */
export function stepList(heading: string, steps: readonly (readonly [string, string])[]): string {
  const rows = steps
    .map(
      ([title, text], i) => `
              <tr>
                <td style="padding:0 16px 16px 0;vertical-align:top;width:28px;font-family:${FONT};font-size:15px;line-height:22px;font-weight:bold;color:${COLOR.black};">${i + 1}.</td>
                <td style="padding:0 0 16px 0;vertical-align:top;font-family:${FONT};font-size:15px;line-height:22px;color:${COLOR.charcoal};"><strong style="color:${COLOR.black};">${escapeHtml(title)}</strong><br>${escapeHtml(text)}</td>
              </tr>`,
    )
    .join("");
  return `
            <h2 style="margin:32px 0 16px 0;font-family:${FONT};font-size:18px;line-height:24px;font-weight:bold;color:${COLOR.black};">${escapeHtml(heading)}</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
            </table>`;
}
