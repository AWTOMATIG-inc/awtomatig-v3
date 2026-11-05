import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, EmptyState, PageHeader } from "@/components/ui";
import { can, requireSession } from "@/lib/auth/session";

import { FaqForm } from "../FaqForm";

export const metadata: Metadata = { title: "New FAQ" };

/** A new FAQ: saved as a draft, or published at once. */
export default async function NewFaqPage() {
  const session = await requireSession();

  const back = (
    <Link
      href="/cms/faqs"
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      All FAQs
    </Link>
  );

  if (!can(session, "cms.faq.create")) {
    return (
      <>
        {back}
        <PageHeader title="New FAQ" />
        <Card>
          <EmptyState>You do not have permission to create FAQs. Ask an administrator to add it to your role.</EmptyState>
        </Card>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title="New FAQ"
        description="Save a draft to keep working on it, or publish it to show it on the website right away."
      />
      <FaqForm canSubmit />
    </>
  );
}
