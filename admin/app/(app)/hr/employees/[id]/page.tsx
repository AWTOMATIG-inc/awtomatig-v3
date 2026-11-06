import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button, Card, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { formatPlainDate } from "@/lib/format";
import {
  EMPLOYMENT_TYPE_LABEL,
  employeeEditHref,
  employeeHref,
  EXIT_TYPE_LABEL,
  formatPeriod,
  salaryText,
  STATUS_LABEL,
  WORK_MODE_LABEL,
} from "@/lib/hr/employees";

import { DeleteEmployeeButton } from "./DeleteEmployeeButton";
import { DocumentsCard } from "./DocumentsCard";
import { EmploymentButton } from "./EmploymentDialog";
import { LeaveControls } from "./LeaveControls";
import { Timeline } from "./Timeline";

export const metadata: Metadata = { title: "Employee" };

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

/** One employee: who they are and what they do now on the left, their career timeline and documents on the right. */
export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const back = (
    <Link
      href="/hr/employees"
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      All employees
    </Link>
  );

  if (!can(session, "hr.employee.read")) {
    return (
      <>
        {back}
        <PageHeader title="Employee" />
        <Card>
          <EmptyState>
            You do not have access to employees. Ask an administrator to add the HR permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const canUpdate = can(session, "hr.employee.update");
  const canReadDocuments = can(session, "hr.document.read");
  const api = await serverApi();
  const [employeeResult, departments, designations, documents] = await Promise.all([
    api.GET("/api/v1/hr/employees/{id}", { params: { path: { id } } }),
    canUpdate && can(session, "hr.department.read")
      ? api.GET("/api/v1/hr/departments", { params: { query: { active: "true" } } })
      : null,
    canUpdate ? api.GET("/api/v1/hr/designations") : null,
    canReadDocuments ? api.GET("/api/v1/hr/employees/{id}/documents", { params: { path: { id } } }) : null,
  ]);
  const { data: employee, response } = employeeResult;
  if (response.status === 401) redirect("/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!employee) {
    return (
      <>
        {back}
        <PageHeader title="Employee" />
        <Card>
          <EmptyState>This employee could not be loaded. Reload the page to try again.</EmptyState>
        </Card>
      </>
    );
  }

  const canSeeSensitive = can(session, "hr.sensitive.read");
  const current = employee.timeline.find((block) => block.status === "current");
  const left = employee.status === "left";
  const dialogProps = {
    employee,
    departments: departments?.data?.items ?? [],
    designations: designations?.data?.designations ?? [],
    canSeeSensitive,
  };

  return (
    <>
      {back}
      <PageHeader
        title={employee.fullName}
        description={[employee.employeeId, employee.designation, employee.department?.name].filter(Boolean).join(" · ")}
        actions={
          <>
            <StatusBadge>{STATUS_LABEL[employee.status]}</StatusBadge>
            {canUpdate && (
              <>
                <Button href={employeeEditHref(employee.id)} variant="outline">
                  Edit details
                </Button>
                <LeaveControls employee={employee} />
                {!left && <EmploymentButton {...dialogProps} mode="update" variant="primary" />}
              </>
            )}
          </>
        }
      />

      <div className="grid gap-20 lg:grid-cols-3">
        <div className="flex flex-col gap-20">
          <Card aria-labelledby="personal-title">
            <CardHeader id="personal-title" title="Personal details" />
            <dl className="grid gap-20 p-20">
              <Detail label="Email">
                <a href={`mailto:${employee.email}`} className={LINK}>
                  {employee.email}
                </a>
              </Detail>
              <Detail label="Phone">
                <a href={`tel:${employee.phone.replace(/[^\d+]/g, "")}`} className={LINK}>
                  {employee.phone}
                </a>
              </Detail>
              <Detail label="Address">
                <span className="whitespace-pre-line">{employee.address}</span>
              </Detail>
              <Detail label="NID">
                <span className="tabular-nums">{employee.nid}</span>
                {employee.nidMasked && <span className="text-fg-muted"> · only the last four digits are shown to your role</span>}
              </Detail>
              <Detail label="Joined">{formatPlainDate(employee.joinedOn)}</Detail>
            </dl>
          </Card>

          <Card aria-labelledby="employment-title">
            <CardHeader id="employment-title" title="Employment" />
            <dl className="grid gap-20 p-20">
              <Detail label="Role type">{EMPLOYMENT_TYPE_LABEL[employee.employmentType]}</Detail>
              <Detail label="Work mode">{WORK_MODE_LABEL[employee.workMode]}</Detail>
              <Detail label="Department">{employee.department?.name ?? "-"}</Detail>
              <Detail label="Manager">
                {employee.manager ? (
                  <Link href={employeeHref(employee.manager.id)} className={LINK}>
                    {employee.manager.employeeId} · {employee.manager.fullName}
                  </Link>
                ) : (
                  "-"
                )}
              </Detail>
              {employee.salary !== undefined && (
                <Detail label="Salary (per month)">
                  {employee.salary === null ? (
                    <span className="text-fg-muted">Not set</span>
                  ) : (
                    <span className="tabular-nums">{salaryText(employee.salary)}</span>
                  )}
                </Detail>
              )}
              <Detail label="Employment period">
                {employee.status === "upcoming" ? (
                  "Not started yet"
                ) : (
                  <>
                    {formatPeriod(employee.period)}
                    <span className="text-fg-muted">
                      {" "}
                      · {employee.period.totalDays.toLocaleString("en-GB")} days{left ? "" : " so far"}
                    </span>
                  </>
                )}
              </Detail>
              {current?.period && (
                <Detail label={left ? "Time in last role" : "Time in current role"}>{formatPeriod(current.period)}</Detail>
              )}
              {employee.leftOn && (
                <>
                  <Detail label={left ? "Left on" : "Leaves on"}>{formatPlainDate(employee.leftOn)}</Detail>
                  {employee.exitType && <Detail label="Reason for leaving">{EXIT_TYPE_LABEL[employee.exitType]}</Detail>}
                  {employee.exitNote && <Detail label="Exit note">{employee.exitNote}</Detail>}
                </>
              )}
            </dl>
          </Card>

          {employee.directReports.length > 0 && (
            <Card aria-labelledby="reports-title">
              <CardHeader id="reports-title" title="Direct reports" subtitle="People who report to them today." />
              <ul className="flex flex-col p-20 pt-12">
                {employee.directReports.map((report) => (
                  <li key={report.id} className="border-border border-b py-12 first:pt-4 last:border-b-0 last:pb-0">
                    <Link href={employeeHref(report.id)} className="type-body-14 text-fg-strong font-medium hover:underline">
                      {report.fullName}
                    </Link>
                    <p className="type-body-14 text-fg-muted">
                      {report.employeeId} · {report.designation}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-20 lg:col-span-2">
          <Card aria-labelledby="timeline-title">
            <CardHeader
              id="timeline-title"
              title="Career timeline"
              subtitle="Every role, newest first. Each change to the employment details adds an entry."
              action={canUpdate ? <EmploymentButton {...dialogProps} mode="past" variant="outline" /> : undefined}
            />
            <Timeline employeeId={employee.id} blocks={employee.timeline} canUpdate={canUpdate} />
          </Card>

          {canReadDocuments ? (
            documents?.data ? (
              <DocumentsCard
                employeeId={employee.id}
                documents={documents.data.items}
                canManage={can(session, "hr.document.manage")}
              />
            ) : (
              <Card aria-labelledby="documents-title">
                <CardHeader id="documents-title" title="Documents" />
                <EmptyState>The documents could not be loaded. Reload the page to try again.</EmptyState>
              </Card>
            )
          ) : (
            <Card aria-labelledby="documents-title">
              <CardHeader id="documents-title" title="Documents" />
              <EmptyState>
                You do not have access to documents. Ask an administrator to add the document permission to your role.
              </EmptyState>
            </Card>
          )}

          {can(session, "hr.employee.delete") && (
            <Card aria-labelledby="delete-title">
              <CardHeader
                id="delete-title"
                title="Delete this record"
                subtitle="For a record created by mistake. Someone who worked here should be marked as left, which keeps their history."
                action={
                  <DeleteEmployeeButton
                    id={employee.id}
                    name={employee.fullName}
                    entries={employee.timeline.length}
                    documents={documents?.data ? documents.data.items.length : null}
                  />
                }
              />
              <div className="pb-20" />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
