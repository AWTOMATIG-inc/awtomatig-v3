/**
 * What the Account page says after an employee opens one of the two email-change links. The backend sends each link back to
 * `/account?email=approved` or `/account?email=changed` (fixed paths it sets itself) and Better Auth adds `error=…` when a link
 * could not be used. Only those two values and the presence of `error` are read; nothing from the URL is ever shown as text.
 */
export type EmailLinkNotice = { tone: "info" | "error"; text: string } | null;

export function emailLinkNotice(
  params: { email?: string | string[]; error?: string | string[] },
  currentEmail: string,
): EmailLinkNotice {
  const email = typeof params.email === "string" ? params.email : null;
  const failed = typeof params.error === "string" && params.error.length > 0;
  if (email !== "approved" && email !== "changed") return null;

  if (failed) {
    return {
      tone: "error",
      text: "That link did not work. Links last 1 hour and can be used once, so it may have expired or already been used. If you still want to change your email, start again below.",
    };
  }
  if (email === "approved") {
    return {
      tone: "info",
      text: "If you were approving an email change, now check the new address for the second link. The change is not finished until you open it.",
    };
  }
  return {
    tone: "info",
    text: `Your sign-in email is now ${currentEmail}. Use it to sign in from now on. We sent a notice to your old address.`,
  };
}
