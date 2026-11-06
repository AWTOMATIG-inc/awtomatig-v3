import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { InlineError } from "@/components/ui";
import { getSession } from "@/lib/auth/session";

import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  if (await getSession()) redirect("/");

  const { token, error } = await searchParams;
  const isInvalid = !token || Boolean(error);

  if (isInvalid) {
    return (
      <AuthCard title="Reset password" subtitle="Set a new password for your account.">
        <div className="flex flex-col gap-20">
          <InlineError>That reset link did not work. It may have expired or already been used.</InlineError>
          <Link href="/forgot-password" className="type-body-14 text-fg-muted hover:text-fg-primary self-start">
            Request a new link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" subtitle="Choose a new password for your account.">
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
