import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { getSession } from "@/lib/auth/session";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  if (await getSession()) redirect("/");

  return (
    <AuthCard title="Forgot password?" subtitle="Enter your work email and we will send you a reset link.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
