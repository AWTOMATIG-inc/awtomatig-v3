import { detailCard, emailButton, emailDocument, emailIntro, emailParagraph, escapeHtml } from "./layout";

/** What a template returns: everything of a message except who it goes to. */
export interface MailContent {
  subject: string;
  text: string;
  html: string;
}

const FOOTER = "This is an automated message from the AWTOMATIG admin. Please do not reply to it.";

/** "6 November 2026, 14:30" in Dhaka time, the company's time zone. */
export function formatDhakaTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Dhaka",
    hour12: false,
  }).format(date);
}

// The subject is a fixed line: a name is never put in a header.

/** Sent to an employee after their password was changed, so a change they did not make is noticed. */
export function passwordChangedEmail({ name, changedAt }: { name: string; changedAt: Date }): MailContent {
  const when = `${formatDhakaTime(changedAt)} (Dhaka time)`;
  const subject = "Your AWTOMATIG admin password was changed";
  const warning =
    "If you did not make this change, contact an administrator right away. Someone else may have access to your account.";

  return {
    subject,
    text: [
      `Hello ${name},`,
      "",
      `The password for your AWTOMATIG admin account was changed on ${when}.`,
      "",
      "If you made this change, you do not need to do anything.",
      "",
      warning,
      "",
      FOOTER,
    ].join("\n"),
    html: emailDocument({
      title: subject,
      preheader: "The password for your admin account was just changed.",
      note: FOOTER,
      body:
        emailIntro(
          "Your password was changed",
          `Hello ${escapeHtml(name)}, the password for your AWTOMATIG admin account was changed.`,
        ) +
        detailCard([{ label: "Changed", value: when }]) +
        emailParagraph("If you made this change, you do not need to do anything.") +
        emailParagraph(`<strong>${escapeHtml(warning)}</strong>`),
    }),
  };
}

/** How long a change-email or password-reset link works, in the words of the messages. Better Auth's default (ACCOUNT_PLAN.md Q7). */
const LINK_LIFETIME = "1 hour";

/** Sent to an employee who requested a password reset. Contains the single-use reset link. */
export function passwordResetEmail({ name, link }: { name: string; link: string }): MailContent {
  const subject = "Reset your AWTOMATIG admin password";
  const warning = "If you did not ask to reset your password, you can safely ignore this message. Your password will not change.";

  return {
    subject,
    text: [
      `Hello ${name},`,
      "",
      "Someone asked to reset the password for your AWTOMATIG admin account.",
      "",
      `To set a new password, open the link below. It works for ${LINK_LIFETIME}.`,
      "",
      link,
      "",
      warning,
      "",
      FOOTER,
    ].join("\n"),
    html: emailDocument({
      title: subject,
      preheader: "Reset the password for your admin account.",
      note: FOOTER,
      body:
        emailIntro(
          "Reset your password",
          `Hello ${escapeHtml(name)}, someone asked to reset the password for your AWTOMATIG admin account.`,
        ) +
        emailParagraph(`Open the link below to set a new password. It works for ${LINK_LIFETIME}.`) +
        emailButton("Reset password", link) +
        emailParagraph(`<strong>${escapeHtml(warning)}</strong>`),
    }),
  };
}

/** Mail 1 of an email change, to the CURRENT address: the employee approves the change from the inbox they already use. */
export function emailChangeApprovalEmail({
  name,
  newEmail,
  link,
}: {
  name: string;
  newEmail: string;
  link: string;
}): MailContent {
  const subject = "Approve changing your AWTOMATIG admin email";
  const warning = "If you did not ask for this, do not open the link. Change your password and tell an administrator.";

  return {
    subject,
    text: [
      `Hello ${name},`,
      "",
      `Someone asked to change the sign-in email of your AWTOMATIG admin account to ${newEmail}.`,
      "",
      `To approve this, open the link below. It works for ${LINK_LIFETIME}. We will then ask the new address to confirm.`,
      "",
      link,
      "",
      warning,
      "",
      FOOTER,
    ].join("\n"),
    html: emailDocument({
      title: subject,
      preheader: "Approve the change of your admin sign-in email.",
      note: FOOTER,
      body:
        emailIntro(
          "Approve the email change",
          `Hello ${escapeHtml(name)}, someone asked to change the sign-in email of your AWTOMATIG admin account.`,
        ) +
        detailCard([{ label: "New email", value: newEmail }]) +
        emailParagraph(
          `Open the link to approve it. It works for ${LINK_LIFETIME}. We will then ask the new address to confirm.`,
        ) +
        emailButton("Approve the change", link) +
        emailParagraph(`<strong>${escapeHtml(warning)}</strong>`),
    }),
  };
}

/** Mail 2 of an email change, to the NEW address: proves the employee can read it. */
export function emailChangeConfirmEmail({ name, link }: { name: string; link: string }): MailContent {
  const subject = "Confirm your new AWTOMATIG admin email";
  const note = "If you did not ask for this, ignore this message: nothing changes unless the link is opened.";
  const lead =
    "This address was given as the new sign-in email of an AWTOMATIG admin account. The change was already approved from the old address.";

  return {
    subject,
    text: [
      `Hello ${name},`,
      "",
      lead,
      "",
      `To finish, open the link below. It works for ${LINK_LIFETIME}.`,
      "",
      link,
      "",
      note,
      "",
      FOOTER,
    ].join("\n"),
    html: emailDocument({
      title: subject,
      preheader: "Confirm this address to finish changing the sign-in email.",
      note: FOOTER,
      body:
        emailIntro("Confirm your new email", `Hello ${escapeHtml(name)}, ${escapeHtml(lead)}`) +
        emailParagraph(`Open the link to finish. It works for ${LINK_LIFETIME}.`) +
        emailButton("Confirm this address", link) +
        emailParagraph(escapeHtml(note)),
    }),
  };
}

/** Sent to the OLD address after the change, so a change the employee did not make is noticed. */
export function emailChangedEmail({
  name,
  newEmail,
  changedAt,
}: {
  name: string;
  newEmail: string;
  changedAt: Date;
}): MailContent {
  const when = `${formatDhakaTime(changedAt)} (Dhaka time)`;
  const subject = "Your AWTOMATIG admin sign-in email was changed";
  const warning =
    "If you did not make this change, contact an administrator right away. Someone else may have access to your account.";

  return {
    subject,
    text: [
      `Hello ${name},`,
      "",
      `The sign-in email of your AWTOMATIG admin account was changed to ${newEmail} on ${when}. You will sign in with the new address from now on.`,
      "",
      "If you made this change, you do not need to do anything.",
      "",
      warning,
      "",
      FOOTER,
    ].join("\n"),
    html: emailDocument({
      title: subject,
      preheader: "The sign-in email of your admin account was just changed.",
      note: FOOTER,
      body:
        emailIntro(
          "Your sign-in email was changed",
          `Hello ${escapeHtml(name)}, the sign-in email of your AWTOMATIG admin account was changed. You will sign in with the new address from now on.`,
        ) +
        detailCard([
          { label: "New email", value: newEmail },
          { label: "Changed", value: when },
        ]) +
        emailParagraph("If you made this change, you do not need to do anything.") +
        emailParagraph(`<strong>${escapeHtml(warning)}</strong>`),
    }),
  };
}

/** The message `npm run mail:check` sends to prove the Gmail login works and the mail lands in an inbox. */
export function mailCheckEmail({ sentAt }: { sentAt: Date }): MailContent {
  const subject = "AWTOMATIG mail check";
  const when = `${formatDhakaTime(sentAt)} (Dhaka time)`;

  return {
    subject,
    text: [
      `This is a test message from the AWTOMATIG backend, sent on ${when}.`,
      "",
      "If you can read it, account emails will arrive.",
      "",
      FOOTER,
    ].join("\n"),
    html: emailDocument({
      title: subject,
      preheader: "A test message from the AWTOMATIG backend.",
      note: FOOTER,
      body:
        emailIntro(
          "Mail check",
          "This is a test message from the AWTOMATIG backend. If you can read it, account emails will arrive.",
        ) + detailCard([{ label: "Sent", value: when }]),
    }),
  };
}
