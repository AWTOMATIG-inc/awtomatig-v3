import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { SERVICE_LABEL } from "@/lib/cms/case-studies";
import { parseTestimonialNotice, TESTIMONIAL_NOTICE_TEXT, testimonialStateLabel, testimonialTone } from "@/lib/cms/testimonials";

import { TestimonialActions } from "../TestimonialActions";
import { TestimonialForm } from "../TestimonialForm";
import { LogoPanel } from "./LogoPanel";

export const metadata: Metadata = { title: "Testimonial" };

/** One testimonial: its details form, its logo, and the actions that change its life (publish, unpublish, delete). */
export default async function TestimonialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const notice = parseTestimonialNotice((await searchParams).notice);

  const back = (
    <Link
      href="/cms/testimonials"
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      All testimonials
    </Link>
  );

  if (!can(session, "cms.testimonial.read")) {
    return (
      <>
        {back}
        <PageHeader title="Testimonial" />
        <Card>
          <EmptyState>
            You do not have access to testimonials. Ask an administrator to add the testimonial permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data: testimonial, response } = await (
    await serverApi()
  ).GET("/api/v1/cms/testimonials/{id}", { params: { path: { id } } });
  if (response.status === 401) redirect("/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!testimonial) {
    return (
      <>
        {back}
        <PageHeader title="Testimonial" />
        <Card>
          <EmptyState>This testimonial could not be loaded. Reload the page to try again.</EmptyState>
        </Card>
      </>
    );
  }

  const canUpdate = can(session, "cms.testimonial.update");
  return (
    <>
      {back}
      <PageHeader
        title={testimonial.name}
        description={`${testimonial.role} · ${testimonial.company} · ${SERVICE_LABEL[testimonial.service]}`}
        actions={
          <>
            <StatusBadge tone={testimonialTone(testimonial)}>{testimonialStateLabel(testimonial)}</StatusBadge>
            <TestimonialActions
              variant="header"
              canUpdate={canUpdate}
              canDelete={can(session, "cms.testimonial.delete")}
              testimonial={{
                id: testimonial.id,
                name: testimonial.name,
                company: testimonial.company,
                status: testimonial.status,
                consentConfirmed: testimonial.consentConfirmed,
              }}
            />
          </>
        }
      />
      {notice && (
        <p role="status" className="type-body-14 text-fg-primary -mt-12 mb-24 flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-caution mt-8 size-6 shrink-0 rounded-full" />
          {TESTIMONIAL_NOTICE_TEXT[notice]}
        </p>
      )}
      {testimonial.status === "published" ? (
        <p className="type-body-14 text-fg-muted -mt-12 mb-24">
          This testimonial is live. Changes you save appear on the website within about a minute. Unpublish it to delete it, or to
          withdraw the client&apos;s agreement.
        </p>
      ) : (
        !testimonial.consentConfirmed && (
          <p className="type-body-14 text-fg-muted -mt-12 mb-24">
            Record the client&apos;s agreement below to be able to publish this testimonial.
          </p>
        )
      )}

      <div className="flex flex-col gap-20">
        <TestimonialForm testimonial={testimonial} canSubmit={canUpdate} />
        <LogoPanel testimonial={testimonial} canUpdate={canUpdate} />
      </div>
    </>
  );
}
