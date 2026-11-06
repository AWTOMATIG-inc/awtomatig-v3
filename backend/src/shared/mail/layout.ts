// The look of the emails the backend sends: the same single 600px column as the website's emails (a charcoal wordmark bar with a
// cyan rule over a white card), so mail from either app reads as one company. Copied, not imported: the apps never import each other.
//
// DELIBERATE EXCEPTION to "no raw hex": mail clients cannot read CSS variables, so the website's tokens are copied as values, each
// with the token it comes from. If a token changes, change it here too. Markup is nested tables with inline styles, the only thing
// every mail client renders alike.
const COLOR = {
  charcoal: "#1E1E1E", // surface-inverse: header, body text
  cyan: "#02D5E8", // action-primary: the rule under the header and the button
  offWhite: "#F0F0F0", // surface-subtle: page and detail card
  white: "#FFFFFF", // surface: the message card
  gray: "#D9D9D9", // border: hairlines
  black: "#000000", // fg-strong: headline and values
  muted: "#484848", // fg-muted, flattened because mail clients drop alpha
} as const;

// Web fonts are unreliable in mail, so Inter falls back to system sans-serif.
const FONT = "Arial, Helvetica, sans-serif";

export const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** The whole document. `body` is HTML already built with the helpers below; `note` is one plain line under the card. */
export function emailDocument({
  title,
  preheader,
  body,
  note,
}: {
  title: string;
  preheader: string;
  body: string;
  note: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.offWhite};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.offWhite};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;">
        <tr>
          <td style="background:${COLOR.charcoal};padding:28px 32px;border-bottom:3px solid ${COLOR.cyan};border-radius:12px 12px 0 0;font-family:${FONT};font-size:20px;line-height:24px;font-weight:bold;letter-spacing:4px;color:${COLOR.white};">AWTOMATIG</td>
        </tr>
        <tr>
          <td style="background:${COLOR.white};padding:36px 32px;border-radius:0 0 12px 12px;">${body}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 0 32px;font-family:${FONT};font-size:12px;line-height:18px;color:${COLOR.muted};">${escapeHtml(note)}</td>
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

/** Off-white card of label / value rows split by hairlines. Labels and values are plain text (escaped here). */
export function detailCard(rows: readonly { label: string; value: string }[]): string {
  const cells = rows
    .map(({ label, value }, i) => {
      const border = i > 0 ? `border-top:1px solid ${COLOR.gray};` : "";
      return `
                <tr>
                  <td style="padding:12px 0;${border}font-family:${FONT};font-size:12px;line-height:16px;letter-spacing:0.5px;text-transform:uppercase;color:${COLOR.muted};width:130px;vertical-align:top;">${escapeHtml(label)}</td>
                  <td style="padding:12px 0;${border}font-family:${FONT};font-size:15px;line-height:22px;font-weight:bold;color:${COLOR.black};vertical-align:top;">${escapeHtml(value)}</td>
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

/** A paragraph after the intro or the card. `html` is already escaped by the caller. */
export function emailParagraph(html: string): string {
  return `
            <p style="margin:24px 0 0 0;font-family:${FONT};font-size:15px;line-height:24px;color:${COLOR.charcoal};">${html}</p>`;
}

/** The one call-to-action button: black text on the cyan rule colour, like the website's primary button. `href` is escaped here. */
export function emailButton(label: string, href: string): string {
  return `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0 0;">
              <tr>
                <td style="background:${COLOR.cyan};border-radius:6px;">
                  <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${COLOR.black};text-decoration:none;">${escapeHtml(label)}</a>
                </td>
              </tr>
            </table>`;
}
