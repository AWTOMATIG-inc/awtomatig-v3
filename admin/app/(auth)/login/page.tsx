import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { safeNextPath } from "@/lib/auth/client";
import { getSession } from "@/lib/auth/session";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  // Already signed in: nothing to do here.
  if (await getSession()) redirect(next);

  const resetSuccess = params.reset === "1";

  return (
    <AuthCard title="Sign in" subtitle="For AWTOMATIG employees.">
      {resetSuccess && (
        <p role="status" className="type-body-14 text-fg-primary border-border rounded-8 mb-20 border p-12">
          Your password was reset. Sign in with the new password.
        </p>
      )}
      <LoginForm next={next} />
    </AuthCard>
  );
}
