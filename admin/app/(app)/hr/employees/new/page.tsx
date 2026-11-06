import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, EmptyState, PageHeader } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";

import { EmployeeForm } from "../EmployeeForm";

export const metadata: Metadata = { title: "Add employee" };

export default async function NewEmployeePage() {
  const session = await requireSession();

  const back = (
    <Link
      href="/hr/employees"
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      All employees
    </Link>
  );

  if (!can(session, "hr.employee.create")) {
    return (
      <>
        {back}
        <PageHeader title="Add employee" />
        <Card>
          <EmptyState>
            You do not have permission to add employees. Ask an administrator to add the HR permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  // The pickers need the active departments and the designations already in use; both are small lists.
  const api = await serverApi();
  const [departments, designations] = await Promise.all([
    can(session, "hr.department.read") ? api.GET("/api/v1/hr/departments", { params: { query: { active: "true" } } }) : null,
    api.GET("/api/v1/hr/designations"),
  ]);
  if (designations.response.status === 401) redirect("/login");

  return (
    <>
      {back}
      <PageHeader title="Add employee" description="Personal details and the first entry of their career timeline." />
      <EmployeeForm
        departments={departments?.data?.items ?? []}
        designations={designations.data?.designations ?? []}
        canSeeSensitive={can(session, "hr.sensitive.read")}
      />
    </>
  );
}
