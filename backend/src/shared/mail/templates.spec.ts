import {
  emailChangeApprovalEmail,
  emailChangeConfirmEmail,
  emailChangedEmail,
  formatDhakaTime,
  mailCheckEmail,
  passwordChangedEmail,
  passwordResetEmail,
} from "./templates";

describe("mail templates", () => {
  // 08:30 UTC is 14:30 in Dhaka (UTC+6, no daylight saving).
  const at = new Date("2026-11-06T08:30:00Z");

  it("formats times in Dhaka", () => {
    expect(formatDhakaTime(at)).toBe("6 November 2026 at 14:30");
  });

  it("says the password was changed, when, and what to do if it was not the employee", () => {
    const mail = passwordChangedEmail({ name: "Jane Doe", changedAt: at });
    expect(mail.subject).toBe("Your AWTOMATIG admin password was changed");
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain("Jane Doe");
      expect(body).toContain("6 November 2026 at 14:30 (Dhaka time)");
      expect(body).toContain("contact an administrator right away");
    }
  });

  it("escapes the name in the HTML and keeps it out of the subject", () => {
    const mail = passwordChangedEmail({ name: `<script>alert("x")</script> & Co`, changedAt: at });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("&amp; Co");
    expect(mail.subject).not.toContain("script");
  });

  it("has a plain-text part and an HTML part with no remote images or tracking", () => {
    for (const mail of [passwordChangedEmail({ name: "A", changedAt: at }), mailCheckEmail({ sentAt: at })]) {
      expect(mail.text.length).toBeGreaterThan(20);
      expect(mail.html).toMatch(/^<!doctype html>/);
      expect(mail.html).not.toMatch(/<img|src=|http:\/\/|https:\/\//i);
    }
  });

  describe("password reset", () => {
    const link = "https://admin.example.test/reset-password?token=reset-12345";

    it("includes the reset link and warning", () => {
      const mail = passwordResetEmail({ name: "Jane Doe", link });
      expect(mail.subject).toBe("Reset your AWTOMATIG admin password");
      for (const body of [mail.text, mail.html]) {
        expect(body).toContain("Jane Doe");
        expect(body).toContain("1 hour");
        expect(body).toContain("safely ignore this message");
      }
      expect(mail.text).toContain(link);
      expect(mail.html).toContain(`href="${link}"`);
      expect(mail.html).toContain("Reset password");
    });

    it("escapes the name in the HTML and keeps it out of the subject", () => {
      const mail = passwordResetEmail({ name: `<b>Jane</b> & Co`, link });
      expect(mail.subject).not.toContain("Jane");
      expect(mail.html).not.toContain("<b>Jane");
      expect(mail.html).toContain("&lt;b&gt;Jane&lt;/b&gt; &amp; Co");
    });
  });

  describe("email change", () => {
    const link = "https://admin.example.test/api/v1/auth/verify-email?token=abc.def.ghi&callbackURL=%2Faccount";

    it("asks the current address to approve, naming the new address and carrying the link", () => {
      const mail = emailChangeApprovalEmail({ name: "Jane Doe", newEmail: "new@example.test", link });
      expect(mail.subject).toBe("Approve changing your AWTOMATIG admin email");
      for (const body of [mail.text, mail.html]) {
        expect(body).toContain("new@example.test");
        expect(body).toContain("1 hour");
        expect(body).toContain("do not open the link");
      }
      expect(mail.text).toContain(link);
      // In HTML the `&` of the query string is escaped in the href.
      expect(mail.html).toContain(`href="${link.replace(/&/g, "&amp;")}"`);
    });

    it("asks the new address to confirm without naming the old one", () => {
      const mail = emailChangeConfirmEmail({ name: "Jane Doe", link });
      expect(mail.subject).toBe("Confirm your new AWTOMATIG admin email");
      expect(mail.text).toContain(link);
      expect(mail.html).toContain("Confirm this address");
    });

    it("tells the old address what changed and when", () => {
      const mail = emailChangedEmail({ name: "Jane Doe", newEmail: "new@example.test", changedAt: at });
      expect(mail.subject).toBe("Your AWTOMATIG admin sign-in email was changed");
      for (const body of [mail.text, mail.html]) {
        expect(body).toContain("new@example.test");
        expect(body).toContain("6 November 2026 at 14:30 (Dhaka time)");
        expect(body).toContain("contact an administrator right away");
      }
    });

    it("never puts a name or an address in a subject, and escapes both in the HTML", () => {
      const name = `<b>Eve</b> & Co`;
      const newEmail = `"x"<y>@example.test`;
      for (const mail of [
        emailChangeApprovalEmail({ name, newEmail, link }),
        emailChangeConfirmEmail({ name, link }),
        emailChangedEmail({ name, newEmail, changedAt: at }),
      ]) {
        expect(mail.subject).not.toMatch(/Eve|example/);
        expect(mail.html).not.toContain("<b>Eve");
        expect(mail.html).not.toContain(`<y>`);
      }
    });
  });

  it("builds the mail-check message", () => {
    const mail = mailCheckEmail({ sentAt: at });
    expect(mail.subject).toBe("AWTOMATIG mail check");
    expect(mail.text).toContain("6 November 2026 at 14:30");
  });
});
