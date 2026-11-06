import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Card, EmptyState, Input, PageHeader, Pagination, Select } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import {
  EMPLOYEES_PAGE_SIZE,
  EMPLOYMENT_TYPE_LABEL,
  EMPLOYMENT_TYPES,
  employeesHref,
  LIST_FILTER_LABEL,
  LIST_FILTERS,
  parseEmployeeParams,
  WORK_MODE_LABEL,
  WORK_MODES,
} from "@/lib/hr/employees";

import { EmployeesTable } from "./EmployeesTable";

export const metadata: Metadata = { title: "Employees" };

/** The company's employees: search and filters above, then the table with paging underneath. Working people are shown by default. */
export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = parseEmployeeParams(await searchParams);

  if (!can(session, "hr.employee.read")) {
    return (
      <>
        <PageHeader title="Employees" />
        <Card>
          <EmptyState>
            You do not have access to employees. Ask an administrator to add the HR permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const api = await serverApi();
  const [list, departmentsResult] = await Promise.all([
    api.GET("/api/v1/hr/employees", {
      params: {
        query: {
          page: params.page,
          pageSize: EMPLOYEES_PAGE_SIZE,
          q: params.q,
          status: params.status,
          departmentId: params.departmentId,
          employmentType: params.employmentType,
          workMode: params.workMode,
          sort: params.sort,
          order: params.order,
        },
      },
    }),
    can(session, "hr.department.read") ? api.GET("/api/v1/hr/departments") : Promise.resolve(null),
  ]);
  const { data, response } = list;
  if (response.status === 401) redirect("/login");

  const departments = departmentsResult?.data?.items ?? [];
  const filtered =
    Boolean(params.q ?? params.departmentId ?? params.employmentType ?? params.workMode) || params.status !== "working";
  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  // A link to a page that no longer exists (people were filtered or removed): go to the last real one.
  if (data && data.items.length === 0 && data.total > 0 && params.page > lastPage)
    redirect(employeesHref({ ...params, page: lastPage }));

  return (
    <>
      <PageHeader
        title="Employees"
        description="The people who work here, their career timeline and their documents."
        actions={
          can(session, "hr.employee.create") ? (
            <Button href="/hr/employees/new" variant="primary" icon={<Plus strokeWidth={1.5} />}>
              Add employee
            </Button>
          ) : undefined
        }
      />

      <Card aria-label="Employees">
        <form method="get" action="/hr/employees" className="flex flex-wrap items-end gap-12 p-16">
          <div className="w-full sm:w-280">
            <label htmlFor="q" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Search
            </label>
            <Input id="q" name="q" type="search" defaultValue={params.q} placeholder="Name, email, phone, EMP ID" />
          </div>
          <div className="w-full sm:w-180">
            <label htmlFor="status" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Show
            </label>
            <Select id="status" name="status" defaultValue={params.status}>
              {LIST_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {LIST_FILTER_LABEL[value]}
                </option>
              ))}
            </Select>
          </div>
          {departments.length > 0 && (
            <div className="w-full sm:w-200">
              <label htmlFor="departmentId" className="type-body-14 text-fg-strong mb-6 block font-medium">
                Department
              </label>
              <Select id="departmentId" name="departmentId" defaultValue={params.departmentId ?? ""}>
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="w-full sm:w-180">
            <label htmlFor="employmentType" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Role type
            </label>
            <Select id="employmentType" name="employmentType" defaultValue={params.employmentType ?? ""}>
              <option value="">All role types</option>
              {EMPLOYMENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {EMPLOYMENT_TYPE_LABEL[value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-160">
            <label htmlFor="workMode" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Work mode
            </label>
            <Select id="workMode" name="workMode" defaultValue={params.workMode ?? ""}>
              <option value="">All work modes</option>
              {WORK_MODES.map((value) => (
                <option key={value} value={value}>
                  {WORK_MODE_LABEL[value]}
                </option>
              ))}
            </Select>
          </div>
          {/* Keep the sort when the filters change. */}
          {params.sort !== "fullName" && <input type="hidden" name="sort" value={params.sort} />}
          {params.order !== "asc" && <input type="hidden" name="order" value={params.order} />}
          <Button type="submit" variant="outline">
            Apply
          </Button>
          {filtered && (
            <Button href="/hr/employees" variant="outline">
              Clear
            </Button>
          )}
        </form>

        <div className="border-border border-t">
          {data ? (
            <EmployeesTable employees={data.items} params={params} filtered={filtered} />
          ) : (
            <EmptyState action={<Button href={employeesHref(params)}>Try again</Button>}>
              {response.status === 403 ? "You do not have access to employees." : "The employees could not be loaded."}
            </EmptyState>
          )}
        </div>

        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            hrefFor={(page) => employeesHref({ ...params, page })}
          />
        )}
      </Card>
    </>
  );
}
