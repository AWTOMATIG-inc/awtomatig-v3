import Image from "next/image";
import type { ReactNode } from "react";

import logo from "@/public/images/awtomatig-full-logo-dark.png";

/** The card every sign-in screen sits in: logo, a title, an optional line under it, then the form. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-12 border-border bg-surface border p-32">
      <Image src={logo} alt="AWTOMATIG" width={140} className="mb-32 h-auto" priority />
      <h1 className="type-heading-28 text-fg-strong">{title}</h1>
      {subtitle && <p className="type-body-14 text-fg-muted mt-4">{subtitle}</p>}
      <div className="mt-24">{children}</div>
    </div>
  );
}
