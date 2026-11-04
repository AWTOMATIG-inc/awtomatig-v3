import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Card, EmptyState, Input, PageHeader, Pagination, Select } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import {
  CASE_STUDIES_PAGE_SIZE,
  CASE_STUDY_STATUSES,
  caseStudiesHref,
  isReorderable,
  parseCaseStudyParams,
  STATUS_LABEL,
} from "@/lib/cms/case-studies";

import { CaseStudiesTable } from "./CaseStudiesTable";

export const metadata: Metadata = { title: "Case Studies" };

/** The website's case studies: search and status filter above, then the table with paging underneath. */
export default async function CaseStudiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = parseCaseStudyParams(await searchParams);

  if (!can(session, "cms.case_study.read")) {
    return (
      <>
        <PageHeader title="Case Studies" />
        <Card>
          <EmptyState>
            You do not have access to case studies. Ask an administrator to add the content permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data, response } = await (
    await serverApi()
  ).GET("/api/v1/cms/case-studies", {
    params: {
      query: {
        page: params.page,
        pageSize: CASE_STUDIES_PAGE_SIZE,
        status: params.status,
        q: params.q,
        sort: params.sort,
        order: params.order,
      },
    },
  });
  if (response.status === 401) redirect("/login");

  const filtered = Boolean(params.status ?? params.q);
  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  // A link to a page that no longer exists (studies were filtered or deleted): go to the last real one.
  if (data && data.items.length === 0 && data.total > 0 && params.page > lastPage)
    redirect(caseStudiesHref({ ...params, page: lastPage }));

  const canUpdate = can(session, "cms.case_study.update");
  const reorderable = isReorderable(params);

  return (
    <>
      <PageHeader
        title="Case Studies"
        description="The work shown on the website's Home page and Case Studies page. Drafts are only visible here."
        actions={
          can(session, "cms.case_study.create") ? (
            <Button href="/cms/case-studies/new" variant="primary" icon={<Plus strokeWidth={1.5} />}>
              New case study
            </Button>
          ) : undefined
        }
      />

      <Card aria-label="Case studies">
        <form method="get" action="/cms/case-studies" className="flex flex-wrap items-end gap-12 p-16">
          <div className="w-full sm:w-320">
            <label htmlFor="q" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Search
            </label>
            <Input id="q" name="q" type="search" defaultValue={params.q} placeholder="Name or client" />
          </div>
          <div className="w-full sm:w-200">
            <label htmlFor="status" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Status
            </label>
            <Select id="status" name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option>
              {CASE_STUDY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
          </div>
          {/* Keep the sort when the filters change. */}
          {params.sort !== "sortOrder" && <input type="hidden" name="sort" value={params.sort} />}
          {params.order !== "asc" && <input type="hidden" name="order" value={params.order} />}
          <Button type="submit" variant="outline">
            Apply
          </Button>
          {filtered && (
            <Button href="/cms/case-studies" variant="outline">
              Clear
            </Button>
          )}
        </form>

        <div className="border-border border-t">
          {data ? (
            <CaseStudiesTable
              studies={data.items}
              params={params}
              firstPosition={(data.page - 1) * data.pageSize}
              total={data.total}
              canUpdate={canUpdate}
              canDelete={can(session, "cms.case_study.delete")}
              reorderable={reorderable && data.total <= 100}
            />
          ) : (
            <EmptyState action={<Button href={caseStudiesHref(params)}>Try again</Button>}>
              {response.status === 403 ? "You do not have access to case studies." : "The case studies could not be loaded."}
            </EmptyState>
          )}
        </div>

        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            hrefFor={(page) => caseStudiesHref({ ...params, page })}
          />
        )}
      </Card>
      {canUpdate && data && data.total > 1 && !reorderable && (
        <p className="type-body-14 text-fg-muted mt-12">
          The order on the website can be changed when the list is not filtered or sorted by another column.
        </p>
      )}
    </>
  );
}
