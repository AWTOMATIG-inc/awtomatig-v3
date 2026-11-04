import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, EmptyState, PageHeader } from "@/components/ui";
import { can, requireSession } from "@/lib/auth/session";

import { CaseStudyForm } from "../CaseStudyForm";

export const metadata: Metadata = { title: "New case study" };

/** A new case study: saved as a draft, or published at once. */
export default async function NewCaseStudyPage() {
  const session = await requireSession();

  const back = (
    <Link
      href="/cms/case-studies"
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      All case studies
    </Link>
  );

  if (!can(session, "cms.case_study.create")) {
    return (
      <>
        {back}
        <PageHeader title="New case study" />
        <Card>
          <EmptyState>You do not have permission to create case studies. Ask an administrator to add it to your role.</EmptyState>
        </Card>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title="New case study"
        description="Save a draft to keep working on it, or publish it to show it on the website right away."
      />
      <CaseStudyForm canSubmit />
    </>
  );
}
