import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, EmptyState, PageHeader } from "@/components/ui";
import { can, requireSession } from "@/lib/auth/session";

import { JobForm } from "../JobForm";

export const metadata: Metadata = { title: "New opening" };

/** A new job opening: saved as a draft, or published at once. */
export default async function NewJobPage() {
  const session = await requireSession();

  const back = (
    <Link
      href="/recruitment/jobs"
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      All job openings
    </Link>
  );

  if (!can(session, "recruitment.job.create")) {
    return (
      <>
        {back}
        <PageHeader title="New opening" />
        <Card>
          <EmptyState>You do not have permission to create job openings. Ask an administrator to add it to your role.</EmptyState>
        </Card>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title="New opening"
        description="Save a draft to keep working on it, or publish it to show it on the careers page right away."
      />
      <JobForm canSubmit />
    </>
  );
}
