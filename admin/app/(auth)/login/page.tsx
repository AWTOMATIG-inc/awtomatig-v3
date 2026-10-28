import type { Metadata } from "next";
import Image from "next/image";

import { SIGN_IN_ENABLED } from "@/lib/auth/config";
import logo from "@/public/images/awtomatig-full-logo-dark.png";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="rounded-12 border-border bg-surface border p-32">
      <Image src={logo} alt="AWTOMATIG" width={140} className="mb-32 h-auto" priority />
      <h1 className="type-heading-28 text-fg-strong">Sign in</h1>
      <p className="type-body-14 text-fg-muted mt-4 mb-24">For AWTOMATIG employees.</p>
      <LoginForm enabled={SIGN_IN_ENABLED} />
    </div>
  );
}
