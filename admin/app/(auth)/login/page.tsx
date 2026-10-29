import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { safeNextPath } from "@/lib/auth/client";
import { getSession } from "@/lib/auth/session";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next);
  // Already signed in: nothing to do here.
  if (await getSession()) redirect(next);

  return (
    <AuthCard title="Sign in" subtitle="For AWTOMATIG employees.">
      <LoginForm next={next} />
    </AuthCard>
  );
}
