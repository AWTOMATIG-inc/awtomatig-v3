import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { STATUS_LABEL, statusTone } from "@/lib/crm/leads";
import { formatDateTime } from "@/lib/format";

import { LeadEditor } from "./LeadEditor";

export const metadata: Metadata = { title: "Contact inquiry" };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="type-caption-12 text-fg-muted uppercase">{label}</dt>
      <dd className="type-body-14 text-fg-primary mt-2 break-words">{children}</dd>
    </div>
  );
}

/** One inquiry: what the visitor wrote and how to reach them on the left, the team's status and notes on the right. */
export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  if (!can(session, "crm.lead.read")) {
    return (
      <>
        <PageHeader title="Contact inquiry" />
        <Card>
          <EmptyState>
            You do not have access to contact inquiries. Ask an administrator to add the CRM permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data: lead, response } = await (await serverApi()).GET("/api/v1/crm/leads/{id}", { params: { path: { id } } });
  if (response.status === 401) redirect("/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!lead) {
    return (
      <>
        <PageHeader title="Contact inquiry" />
        <Card>
          <EmptyState>This inquiry could not be loaded. Reload the page to try again.</EmptyState>
        </Card>
      </>
    );
  }

  return (
    <>
      <Link
        href="/crm/leads"
        className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
      >
        <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
        All contact inquiries
      </Link>
      <PageHeader
        title={lead.name}
        description={lead.company || undefined}
        actions={<StatusBadge tone={statusTone(lead.status)}>{STATUS_LABEL[lead.status]}</StatusBadge>}
      />

      <div className="grid gap-20 lg:grid-cols-3">
        <div className="flex flex-col gap-20 lg:col-span-2">
          <Card aria-labelledby="message-title">
            <CardHeader id="message-title" title="What they wrote" subtitle="What they are trying to improve" />
            <p className="type-body-16 text-fg-primary p-20 whitespace-pre-wrap">{lead.message}</p>
          </Card>

          <Card aria-labelledby="details-title">
            <CardHeader id="details-title" title="Details" />
            <dl className="grid gap-20 p-20 sm:grid-cols-2">
              <Detail label="Email">
                <a
                  href={`mailto:${lead.email}`}
                  className="ease-out-quint underline underline-offset-4 transition-colors duration-200 hover:no-underline motion-reduce:transition-none"
                >
                  {lead.email}
                </a>
              </Detail>
              <Detail label="Company">{lead.company || "-"}</Detail>
              <Detail label="Interested in">{lead.helpWith}</Detail>
              <Detail label="Project type">{lead.projectType}</Detail>
              <Detail label="Budget">{lead.budget || "-"}</Detail>
              <Detail label="Source">{lead.source === "website-contact" ? "Website contact form" : lead.source}</Detail>
              <Detail label="Received">{formatDateTime(lead.createdAt)}</Detail>
              <Detail label="Agreed to be contacted">{formatDateTime(lead.consentAt)}</Detail>
            </dl>
          </Card>
        </div>

        <Card aria-labelledby="followup-title" className="self-start">
          <CardHeader id="followup-title" title="Follow-up" subtitle={`Last changed ${formatDateTime(lead.updatedAt)}`} />
          <div className="p-20">
            <LeadEditor id={lead.id} status={lead.status} notes={lead.notes} canUpdate={can(session, "crm.lead.update")} />
          </div>
        </Card>
      </div>
    </>
  );
}
