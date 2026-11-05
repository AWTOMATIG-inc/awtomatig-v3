import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { FAQ_NOTICE_TEXT, FAQ_PAGES, FAQ_STATUS_LABEL, faqTone, parseFaqNotice } from "@/lib/cms/faqs";

import { FaqActions } from "../FaqActions";
import { FaqForm } from "../FaqForm";

export const metadata: Metadata = { title: "FAQ" };

/** One FAQ: its form, and the actions that change its life (publish, unpublish, delete). */
export default async function FaqPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const notice = parseFaqNotice((await searchParams).notice);

  const back = (
    <Link
      href="/cms/faqs"
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      All FAQs
    </Link>
  );

  if (!can(session, "cms.faq.read")) {
    return (
      <>
        {back}
        <PageHeader title="FAQ" />
        <Card>
          <EmptyState>You do not have access to FAQs. Ask an administrator to add the FAQ permission to your role.</EmptyState>
        </Card>
      </>
    );
  }

  const { data: faq, response } = await (await serverApi()).GET("/api/v1/cms/faqs/{id}", { params: { path: { id } } });
  if (response.status === 401) redirect("/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!faq) {
    return (
      <>
        {back}
        <PageHeader title="FAQ" />
        <Card>
          <EmptyState>This FAQ could not be loaded. Reload the page to try again.</EmptyState>
        </Card>
      </>
    );
  }

  const canUpdate = can(session, "cms.faq.update");
  return (
    <>
      {back}
      <PageHeader
        title={faq.question}
        actions={
          <>
            <StatusBadge tone={faqTone()}>{FAQ_STATUS_LABEL[faq.status]}</StatusBadge>
            <FaqActions
              variant="header"
              canUpdate={canUpdate}
              canDelete={can(session, "cms.faq.delete")}
              faq={{ id: faq.id, question: faq.question, status: faq.status }}
            />
          </>
        }
      />
      {notice && (
        <p role="status" className="type-body-14 text-fg-primary -mt-12 mb-24 flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-caution mt-8 size-6 shrink-0 rounded-full" />
          {FAQ_NOTICE_TEXT[notice]}
        </p>
      )}
      <p className="type-body-14 text-fg-muted -mt-12 mb-24">
        {faq.status === "published"
          ? `This FAQ is live on the website (${FAQ_PAGES}). Changes you save appear within about a minute.`
          : "This FAQ is a draft and is not on the website. Publish it when it is ready."}
      </p>

      <FaqForm faq={faq} canSubmit={canUpdate} />
    </>
  );
}
