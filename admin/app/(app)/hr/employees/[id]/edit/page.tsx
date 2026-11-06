import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card, EmptyState, PageHeader } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { employeeHref } from "@/lib/hr/employees";

import { PersonalForm } from "../../PersonalForm";

export const metadata: Metadata = { title: "Edit employee" };

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const back = (
    <Link
      href={employeeHref(id)}
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      Back to the profile
    </Link>
  );

  if (!can(session, "hr.employee.update")) {
    return (
      <>
        {back}
        <PageHeader title="Edit employee" />
        <Card>
          <EmptyState>
            You do not have permission to edit employees. Ask an administrator to add the HR permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data: employee, response } = await (await serverApi()).GET("/api/v1/hr/employees/{id}", { params: { path: { id } } });
  if (response.status === 401) redirect("/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!employee) {
    return (
      <>
        {back}
        <PageHeader title="Edit employee" />
        <Card>
          <EmptyState>This employee could not be loaded. Reload the page to try again.</EmptyState>
        </Card>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader title={`Edit ${employee.fullName}`} description={employee.employeeId} />
      <PersonalForm employee={employee} canSeeSensitive={can(session, "hr.sensitive.read")} />
    </>
  );
}
