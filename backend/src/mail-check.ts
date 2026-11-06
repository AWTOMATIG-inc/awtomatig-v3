import "dotenv/config";

import { parseEnv } from "./shared/config/env";
import { createMailTransport, MailService } from "./shared/mail/mail.service";
import { mailCheckEmail } from "./shared/mail/templates";

// Proves the app can send mail: logs in to Gmail SMTP with the app password, then sends one test message to the address you give.
// Prints no password and no server detail; a failure shows only the error name and code (the same line the app logs).
//
//   npm run mail:check -- you@example.com
async function main(): Promise<void> {
  const to = process.argv[2];
  if (!to?.includes("@")) {
    console.error("Usage: npm run mail:check -- you@example.com");
    process.exit(2);
  }

  const config = { env: parseEnv(process.env) };
  const mail = new MailService(config, createMailTransport(config));

  await mail.verify();
  console.log("ok  SMTP login");

  await mail.send({ to, ...mailCheckEmail({ sentAt: new Date() }) });
  console.log("ok  test message accepted for delivery: check that it arrived in the inbox, and not in spam");
}

main().catch(() => {
  // MailService has already logged the error name and code.
  console.error("FAIL  mail could not be sent. Check SMTP_USER and SMTP_PASS (a Google app password, not the account password).");
  process.exit(1);
});
