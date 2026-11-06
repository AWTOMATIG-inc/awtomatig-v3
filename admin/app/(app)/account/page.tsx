import type { Metadata } from "next";

import { Card, CardHeader, InlineError, PageHeader } from "@/components/ui";
import { emailLinkNotice } from "@/lib/auth/email-change";
import { requireSession } from "@/lib/auth/session";

import { EmailForm } from "./EmailForm";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Account" };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="type-caption-12 text-fg-muted uppercase">{label}</dt>
      <dd className="type-body-14 text-fg-primary mt-2 break-words">{children}</dd>
    </div>
  );
}

/**
 * The signed-in employee's own account: who they are, the sign-in email and the password. Anyone signed in may open it; it only
 * ever touches their own. The two email-change links from the employee's inboxes land here (`?email=approved` / `?email=changed`).
 */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireSession();
  const notice = emailLinkNotice(await searchParams, user.email);

  return (
    <>
      <PageHeader title="Account" description="Your sign-in details, email and password." />

      <div className="grid gap-20 lg:grid-cols-3">
        <div className="flex flex-col gap-20 lg:col-span-2">
          <Card aria-labelledby="email-title">
            <CardHeader
              id="email-title"
              title="Email address"
              subtitle="The address you sign in with. A change must be approved from your current inbox and confirmed from the new one."
            />
            <div className="flex flex-col gap-20 p-20">
              {notice &&
                (notice.tone === "error" ? (
                  <InlineError>{notice.text}</InlineError>
                ) : (
                  <p role="status" className="type-body-14 text-fg-primary border-border rounded-8 border p-12">
                    {notice.text}
                  </p>
                ))}
              <EmailForm currentEmail={user.email} />
            </div>
          </Card>

          <Card aria-labelledby="password-title">
            <CardHeader id="password-title" title="Password" subtitle="Enter your current password to set a new one." />
            <div className="p-20">
              <PasswordForm email={user.email} />
            </div>
          </Card>
        </div>

        <Card aria-labelledby="details-title" className="self-start">
          <CardHeader id="details-title" title="Your details" />
          <dl className="flex flex-col gap-20 p-20">
            <Detail label="Name">{user.name}</Detail>
            <Detail label="Email">{user.email}</Detail>
            <Detail label="Role">{user.role}</Detail>
          </dl>
        </Card>
      </div>
    </>
  );
}
