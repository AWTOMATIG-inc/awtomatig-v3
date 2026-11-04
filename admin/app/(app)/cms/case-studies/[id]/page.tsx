import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { caseStudyStateLabel, caseStudyTone, NOTICE_TEXT, parseNotice, SERVICE_LABEL } from "@/lib/cms/case-studies";

import { CaseStudyActions } from "../CaseStudyActions";
import { CaseStudyForm } from "../CaseStudyForm";
import { ShowcaseImage } from "./ShowcaseImage";

export const metadata: Metadata = { title: "Case study" };

/** One case study: its image, its details form, and the actions that change its life (publish, unpublish, delete). */
export default async function CaseStudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const notice = parseNotice((await searchParams).notice);

  const back = (
    <Link
      href="/cms/case-studies"
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      All case studies
    </Link>
  );

  if (!can(session, "cms.case_study.read")) {
    return (
      <>
        {back}
        <PageHeader title="Case study" />
        <Card>
          <EmptyState>
            You do not have access to case studies. Ask an administrator to add the content permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data: study, response } = await (await serverApi()).GET("/api/v1/cms/case-studies/{id}", { params: { path: { id } } });
  if (response.status === 401) redirect("/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!study) {
    return (
      <>
        {back}
        <PageHeader title="Case study" />
        <Card>
          <EmptyState>This case study could not be loaded. Reload the page to try again.</EmptyState>
        </Card>
      </>
    );
  }

  const canUpdate = can(session, "cms.case_study.update");
  return (
    <>
      {back}
      <PageHeader
        title={study.title}
        description={`${study.client} · ${SERVICE_LABEL[study.service]} · /case-studies/${study.slug}`}
        actions={
          <>
            <StatusBadge tone={caseStudyTone(study)}>{caseStudyStateLabel(study)}</StatusBadge>
            <CaseStudyActions
              variant="header"
              canUpdate={canUpdate}
              canDelete={can(session, "cms.case_study.delete")}
              study={{ id: study.id, title: study.title, status: study.status, hasImage: study.image !== null }}
            />
          </>
        }
      />
      {notice && (
        <p role="status" className="type-body-14 text-fg-primary -mt-12 mb-24 flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-caution mt-8 size-6 shrink-0 rounded-full" />
          {NOTICE_TEXT[notice]}
        </p>
      )}
      {study.status === "published" ? (
        <p className="type-body-14 text-fg-muted -mt-12 mb-24">
          This case study is live. Changes you save appear on the website within about a minute. Unpublish it to delete it.
        </p>
      ) : (
        !study.image && (
          <p className="type-body-14 text-fg-muted -mt-12 mb-24">
            Upload the showcase image below to be able to publish this case study.
          </p>
        )
      )}

      <div className="flex flex-col gap-20">
        <ShowcaseImage study={study} canUpdate={canUpdate} />
        <CaseStudyForm study={study} canSubmit={canUpdate} />
      </div>
    </>
  );
}
