import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button, Card, EmptyState, Input, PageHeader, Pagination, SegmentedLinks, Select, StatusBadge } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { formatNumber, formatPlainDate } from "@/lib/format";
import {
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUSES,
  APPLICATIONS_PAGE_SIZE,
  applicationsHref,
  parseApplicationParams,
} from "@/lib/recruitment/applications";
import {
  first,
  formatSalary,
  JOB_STATE_LABEL,
  JOB_TYPE_LABEL,
  jobHref,
  jobState,
  jobStateTone,
  WORK_MODE_LABEL,
} from "@/lib/recruitment/jobs";

import { JobForm } from "../JobForm";
import { ApplicationsTable } from "./ApplicationsTable";
import { JobActions } from "./JobActions";

export const metadata: Metadata = { title: "Job opening" };

/** One opening: its applications on one tab, its details (the edit form) on the other. The tab is in the URL. */
export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const rawSearch = await searchParams;
  const tab = first(rawSearch.tab) === "details" ? "details" : "applications";

  const back = (
    <Link
      href="/recruitment/jobs"
      className="type-body-14 text-fg-muted ease-out-quint hover:text-fg-strong mb-12 inline-flex items-center gap-6 transition-colors duration-200 motion-reduce:transition-none"
    >
      <ArrowLeft strokeWidth={1.5} aria-hidden="true" className="size-16" />
      All job openings
    </Link>
  );

  if (!can(session, "recruitment.job.read")) {
    return (
      <>
        {back}
        <PageHeader title="Job opening" />
        <Card>
          <EmptyState>
            You do not have access to job openings. Ask an administrator to add the recruitment permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const api = await serverApi();
  const { data: job, response } = await api.GET("/api/v1/recruitment/jobs/{id}", { params: { path: { id } } });
  if (response.status === 401) redirect("/login");
  if (response.status === 404 || response.status === 400) notFound();
  if (!job) {
    return (
      <>
        {back}
        <PageHeader title="Job opening" />
        <Card>
          <EmptyState>This opening could not be loaded. Reload the page to try again.</EmptyState>
        </Card>
      </>
    );
  }

  const state = jobState(job);
  const canReadApplications = can(session, "recruitment.application.read");
  const options = [
    {
      label: job.applicationCount > 0 ? `Applications (${formatNumber(job.applicationCount)})` : "Applications",
      href: jobHref(id),
      selected: tab === "applications",
    },
    { label: "Details", href: jobHref(id, "details"), selected: tab === "details" },
  ];

  const summary = [
    JOB_TYPE_LABEL[job.jobType],
    WORK_MODE_LABEL[job.workMode],
    job.location,
    formatSalary(job.salaryMin, job.salaryMax),
    `Apply by ${formatPlainDate(job.deadlineOn)}`,
  ].join(" · ");

  return (
    <>
      {back}
      <PageHeader
        title={job.title}
        description={summary}
        actions={
          <>
            <StatusBadge tone={jobStateTone(state)}>{JOB_STATE_LABEL[state]}</StatusBadge>
            <JobActions job={job} canUpdate={can(session, "recruitment.job.update")} />
          </>
        }
      />
      {state === "expired" && (
        <p className="type-body-14 text-fg-muted -mt-12 mb-24">
          The deadline has passed, so this opening no longer takes applications. Close it, or change the deadline under Details.
        </p>
      )}

      <div className="mb-20">
        <SegmentedLinks label="Opening sections" options={options} />
      </div>

      {tab === "details" ? (
        <JobForm job={job} canSubmit={can(session, "recruitment.job.update")} />
      ) : !canReadApplications ? (
        <Card>
          <EmptyState>
            You do not have access to applications. Ask an administrator to add the recruitment permission to your role.
          </EmptyState>
        </Card>
      ) : (
        <ApplicationsTab id={id} rawSearch={rawSearch} canUpdate={can(session, "recruitment.application.update")} />
      )}
    </>
  );
}

async function ApplicationsTab({
  id,
  rawSearch,
  canUpdate,
}: {
  id: string;
  rawSearch: Record<string, string | string[] | undefined>;
  canUpdate: boolean;
}) {
  const params = parseApplicationParams(rawSearch);
  const { data, response } = await (
    await serverApi()
  ).GET("/api/v1/recruitment/jobs/{id}/applications", {
    params: {
      path: { id },
      query: {
        page: params.page,
        pageSize: APPLICATIONS_PAGE_SIZE,
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
  // A link to a page that no longer exists (applications were filtered): go to the last real one.
  if (data && data.items.length === 0 && data.total > 0 && params.page > lastPage)
    redirect(applicationsHref(id, { ...params, page: lastPage }));

  return (
    <Card aria-label="Applications">
      <form method="get" action={`/recruitment/jobs/${id}`} className="flex flex-wrap items-end gap-12 p-16">
        <div className="w-full sm:w-320">
          <label htmlFor="q" className="type-body-14 text-fg-strong mb-6 block font-medium">
            Search
          </label>
          <Input id="q" name="q" type="search" defaultValue={params.q} placeholder="Name or email" />
        </div>
        <div className="w-full sm:w-200">
          <label htmlFor="status" className="type-body-14 text-fg-strong mb-6 block font-medium">
            Status
          </label>
          <Select id="status" name="status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {APPLICATION_STATUS_LABEL[status]}
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
          <Button href={jobHref(id)} variant="outline">
            Clear
          </Button>
        )}
      </form>

      <div className="border-border border-t">
        {data ? (
          <ApplicationsTable jobId={id} applications={data.items} params={params} canUpdate={canUpdate} />
        ) : (
          <EmptyState action={<Button href={applicationsHref(id, params)}>Try again</Button>}>
            {response.status === 403 ? "You do not have access to applications." : "The applications could not be loaded."}
          </EmptyState>
        )}
      </div>

      {data && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          hrefFor={(page) => applicationsHref(id, { ...params, page })}
        />
      )}
    </Card>
  );
}
