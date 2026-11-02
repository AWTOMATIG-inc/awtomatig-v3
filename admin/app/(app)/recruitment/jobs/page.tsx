import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Card, EmptyState, Input, PageHeader, Pagination, Select } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { JOB_STATE_LABEL, JOB_STATUSES, JOBS_PAGE_SIZE, jobsHref, parseJobParams } from "@/lib/recruitment/jobs";

import { JobsTable } from "./JobsTable";

export const metadata: Metadata = { title: "Job Openings" };

/** The company's job openings: search and status filter above, then the table with paging underneath. */
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = parseJobParams(await searchParams);

  if (!can(session, "recruitment.job.read")) {
    return (
      <>
        <PageHeader title="Job Openings" />
        <Card>
          <EmptyState>
            You do not have access to job openings. Ask an administrator to add the recruitment permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data, response } = await (
    await serverApi()
  ).GET("/api/v1/recruitment/jobs", {
    params: {
      query: {
        page: params.page,
        pageSize: JOBS_PAGE_SIZE,
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
  // A link to a page that no longer exists (openings were filtered or removed): go to the last real one.
  if (data && data.items.length === 0 && data.total > 0 && params.page > lastPage)
    redirect(jobsHref({ ...params, page: lastPage }));

  return (
    <>
      <PageHeader
        title="Job Openings"
        description="Positions shown on the website's careers page, and the applications they receive."
        actions={
          can(session, "recruitment.job.create") ? (
            <Button href="/recruitment/jobs/new" variant="primary" icon={<Plus strokeWidth={1.5} />}>
              New opening
            </Button>
          ) : undefined
        }
      />

      <Card aria-label="Job openings">
        <form method="get" action="/recruitment/jobs" className="flex flex-wrap items-end gap-12 p-16">
          <div className="w-full sm:w-320">
            <label htmlFor="q" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Search
            </label>
            <Input id="q" name="q" type="search" defaultValue={params.q} placeholder="Position name" />
          </div>
          <div className="w-full sm:w-200">
            <label htmlFor="status" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Status
            </label>
            <Select id="status" name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option>
              {JOB_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {JOB_STATE_LABEL[status]}
                </option>
              ))}
            </Select>
          </div>
          {/* Keep the sort when the filters change. */}
          {params.sort !== "createdAt" && <input type="hidden" name="sort" value={params.sort} />}
          {params.order !== "desc" && <input type="hidden" name="order" value={params.order} />}
          <Button type="submit" variant="outline">
            Apply
          </Button>
          {filtered && (
            <Button href="/recruitment/jobs" variant="outline">
              Clear
            </Button>
          )}
        </form>

        <div className="border-border border-t">
          {data ? (
            <JobsTable jobs={data.items} params={params} />
          ) : (
            <EmptyState action={<Button href={jobsHref(params)}>Try again</Button>}>
              {response.status === 403 ? "You do not have access to job openings." : "The job openings could not be loaded."}
            </EmptyState>
          )}
        </div>

        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            hrefFor={(page) => jobsHref({ ...params, page })}
          />
        )}
      </Card>
    </>
  );
}
