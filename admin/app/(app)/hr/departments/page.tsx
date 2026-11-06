import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";

import { AddDepartmentButton } from "./DepartmentDialog";
import { DepartmentsTable } from "./DepartmentsTable";

export const metadata: Metadata = { title: "Departments" };

/** The departments employees can belong to. A department in use is deactivated, never deleted. */
export default async function DepartmentsPage() {
  const session = await requireSession();

  if (!can(session, "hr.department.read")) {
    return (
      <>
        <PageHeader title="Departments" />
        <Card>
          <EmptyState>
            You do not have access to departments. Ask an administrator to add the HR permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data, response } = await (await serverApi()).GET("/api/v1/hr/departments");
  if (response.status === 401) redirect("/login");
  const canManage = can(session, "hr.department.manage");

  return (
    <>
      <PageHeader
        title="Departments"
        description="The teams employees belong to. A department with people in it is deactivated, never deleted."
        actions={canManage ? <AddDepartmentButton /> : undefined}
      />
      <Card aria-label="Departments">
        {data ? (
          <DepartmentsTable departments={data.items} canManage={canManage} />
        ) : (
          <EmptyState action={<Button href="/hr/departments">Try again</Button>}>The departments could not be loaded.</EmptyState>
        )}
      </Card>
    </>
  );
}
