import nodemailer from "nodemailer";

/**
 * The Gmail SMTP transport the site sends mail through (an app password, server-only env: SMTP_USER, SMTP_PASS, CONTACT_TO).
 * Returns null, and logs which variable group is missing, when mail is not configured.
 */
export function getMailer(scope: string) {
  const { SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
  if (!SMTP_USER || !SMTP_PASS || !CONTACT_TO) {
    console.error(`[${scope}] SMTP_USER, SMTP_PASS or CONTACT_TO is not set`);
    return null;
  }
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return { transport, from: SMTP_USER, team: CONTACT_TO.split(",").map((to) => to.trim()) };
}
