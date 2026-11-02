import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { formatDateTime, formatFileSize, formatPlainDate } from "@/lib/format";
import { APPLICATION_STATUS_LABEL, applicationTone } from "@/lib/recruitment/applications";
import { jobHref } from "@/lib/recruitment/jobs";

import { ApplicationEditor } from "./ApplicationEditor";
import { ResumeButton } from "./ResumeButton";

export const metadata: Metadata = { title: "Application" };

const LINK =
  "ease-out-quint underline underline-offset-4 transition-colors duration-200 hover:no-underline motion-reduce:transition-none";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="type-caption-12 text-fg-muted uppercase">{label}</dt>
      <dd className="type-body-14 text-fg-primary mt-2 break-words">{children}</dd>
    </div>
  );
}

/** A profile link from the application. The address was checked by the backend (https, GitHub or LinkedIn). */
function ProfileLink({ href }: { href: string | null }) {
  if (!href) return "-";
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
      {href.replace(/^https:\/\/(www\.)?/, "")}
    </a>
  );
}

/** One application: who they are and what they sent on the left, the team's status, notes and the resume on the right. */
export default async function ApplicationPage({ params }: { params: Promise<{ id: string; applicationId: string }> }) {
  const session = await requireSession();
  const { id, applicationId } = await params;

  const back = (
    <Link
      href={jobHref(id)}
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      Back to the opening
    </Link>
  );

  if (!can(session, "recruitment.application.read")) {
    return (
      <>
        {back}
        <PageHeader title="Application" />
        <Card>
          <EmptyState>
            You do not have access to applications. Ask an administrator to add the recruitment permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data: application, response } = await (
    await serverApi()
  ).GET("/api/v1/recruitment/applications/{id}", { params: { path: { id: applicationId } } });
  if (response.status === 401) redirect("/login");
  if (response.status === 404 || response.status === 400) notFound();
  // The address says which opening it belongs to; a mismatch is a wrong link, not another opening's data.
  if (application && application.jobId !== id) notFound();
  if (!application) {
    return (
      <>
        {back}
        <PageHeader title="Application" />
        <Card>
          <EmptyState>This application could not be loaded. Reload the page to try again.</EmptyState>
        </Card>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title={application.fullName}
        description={`Applied for ${application.jobTitle} on ${formatDateTime(application.createdAt)}`}
        actions={
          <StatusBadge tone={applicationTone(application.status)}>{APPLICATION_STATUS_LABEL[application.status]}</StatusBadge>
        }
      />

      <div className="grid gap-20 lg:grid-cols-3">
        <div className="flex flex-col gap-20 lg:col-span-2">
          <Card aria-labelledby="contact-title">
            <CardHeader id="contact-title" title="Contact and links" />
            <dl className="grid gap-20 p-20 sm:grid-cols-2">
              <Detail label="Email">
                <a href={`mailto:${application.email}`} className={LINK}>
                  {application.email}
                </a>
              </Detail>
              <Detail label="Phone">
                <a href={`tel:${application.phone.replace(/[^\d+]/g, "")}`} className={LINK}>
                  {application.phone}
                </a>
              </Detail>
              <Detail label="GitHub">
                <ProfileLink href={application.githubUrl} />
              </Detail>
              <Detail label="LinkedIn">
                <ProfileLink href={application.linkedinUrl} />
              </Detail>
              <Detail label="Agreed to the Privacy Policy">{formatDateTime(application.consentedAt)}</Detail>
            </dl>
          </Card>

          <Card aria-labelledby="education-title">
            <CardHeader id="education-title" title="Education" />
            <ul className="flex flex-col p-20 pt-4">
              {application.educations.map((education, index) => (
                <li key={index} className="border-border border-b py-16 first:pt-12 last:border-b-0 last:pb-0">
                  <p className="type-body-14 text-fg-strong font-medium">
                    {education.degree}, {education.fieldOfStudy}
                  </p>
                  <p className="type-body-14 text-fg-primary">{education.institution}</p>
                  <p className="type-body-14 text-fg-muted">
                    {education.ongoing
                      ? "Ongoing"
                      : education.completedOn
                        ? `Completed ${formatPlainDate(education.completedOn)}`
                        : ""}
                    {education.grade ? ` · ${education.grade}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card aria-labelledby="experience-title">
            <CardHeader id="experience-title" title="Experience" />
            {application.experiences.length === 0 ? (
              <p className="type-body-14 text-fg-muted p-20">No work experience listed.</p>
            ) : (
              <ul className="flex flex-col p-20 pt-4">
                {application.experiences.map((experience, index) => (
                  <li key={index} className="border-border border-b py-16 first:pt-12 last:border-b-0 last:pb-0">
                    <p className="type-body-14 text-fg-strong font-medium">
                      {experience.title}, {experience.company}
                    </p>
                    <p className="type-body-14 text-fg-muted">
                      {formatPlainDate(experience.fromOn)} to {experience.toOn ? formatPlainDate(experience.toOn) : "present"}
                    </p>
                    <p className="type-body-14 text-fg-primary mt-8 whitespace-pre-wrap">{experience.responsibilities}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card aria-labelledby="answers-title">
            <CardHeader id="answers-title" title="Screening answers" />
            {application.answers.length === 0 ? (
              <p className="type-body-14 text-fg-muted p-20">This opening had no screening questions, or none were answered.</p>
            ) : (
              <dl className="flex flex-col gap-20 p-20">
                {application.answers.map((item) => (
                  <div key={item.questionId}>
                    <dt className="type-body-14 text-fg-muted">{item.question}</dt>
                    <dd className="type-body-14 text-fg-primary mt-4 whitespace-pre-wrap">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-20 self-start">
          <Card aria-labelledby="resume-title">
            <CardHeader
              id="resume-title"
              title="Resume"
              subtitle={`${application.resume.name} · ${formatFileSize(application.resume.size)}`}
            />
            <div className="p-20">
              <ResumeButton applicationId={application.id} />
              <p className="type-body-14 text-fg-muted mt-12">
                The link works for five minutes. Each time it is opened is recorded.
              </p>
            </div>
          </Card>

          <Card aria-labelledby="review-title">
            <CardHeader id="review-title" title="Review" subtitle={`Last changed ${formatDateTime(application.updatedAt)}`} />
            <div className="p-20">
              <ApplicationEditor
                id={application.id}
                status={application.status}
                notes={application.notes}
                canUpdate={can(session, "recruitment.application.update")}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
