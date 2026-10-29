import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { LEAD_STATUSES, LEADS_PAGE_SIZE, leadsHref, parseLeadParams, STATUS_LABEL } from "@/lib/crm/leads";
import { formatNumber } from "@/lib/format";

import { LeadsTable } from "./LeadsTable";

export const metadata: Metadata = { title: "Contact Inquiries" };

/** Inquiries from the website's contact form: search and status filter above, then the table with paging underneath. */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = parseLeadParams(await searchParams);

  if (!can(session, "crm.lead.read")) {
    return (
      <>
        <PageHeader title="Contact Inquiries" />
        <Card>
          <EmptyState>
            You do not have access to contact inquiries. Ask an administrator to add the CRM permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data, response } = await (
    await serverApi()
  ).GET("/api/v1/crm/leads", {
    params: {
      query: {
        page: params.page,
        pageSize: LEADS_PAGE_SIZE,
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
  // A link to a page that no longer exists (leads were filtered or removed): go to the last real one.
  if (data && data.items.length === 0 && data.total > 0 && params.page > lastPage)
    redirect(leadsHref({ ...params, page: lastPage }));

  return (
    <>
      <PageHeader title="Contact Inquiries" description="Messages sent through the website contact form." />

      <Card aria-label="Contact inquiries">
        <form method="get" action="/crm/leads" className="flex flex-wrap items-end gap-12 p-16">
          <div className="w-full sm:w-320">
            <label htmlFor="q" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Search
            </label>
            <Input id="q" name="q" type="search" defaultValue={params.q} placeholder="Name, email or company" />
          </div>
          <div className="w-full sm:w-200">
            <label htmlFor="status" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Status
            </label>
            <Select id="status" name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option>
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
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
            <Button href="/crm/leads" variant="outline">
              Clear
            </Button>
          )}
        </form>

        <div className="border-border border-t">
          {data ? (
            <LeadsTable leads={data.items} params={params} canUpdate={can(session, "crm.lead.update")} />
          ) : (
            <EmptyState action={<Button href={leadsHref(params)}>Try again</Button>}>
              {response.status === 403 ? "You do not have access to contact inquiries." : "The inquiries could not be loaded."}
            </EmptyState>
          )}
        </div>

        {data && data.total > 0 && (
          <div className="border-border type-body-14 text-fg-muted flex flex-wrap items-center justify-between gap-12 border-t px-16 py-12">
            <p>
              {formatNumber((data.page - 1) * data.pageSize + 1)}–{formatNumber(Math.min(data.page * data.pageSize, data.total))}{" "}
              of {formatNumber(data.total)}
            </p>
            <div className="flex items-center gap-8">
              {data.page > 1 ? (
                <Button href={leadsHref({ ...params, page: data.page - 1 })} size="sm">
                  Previous
                </Button>
              ) : (
                <Button size="sm" disabled>
                  Previous
                </Button>
              )}
              {data.page < lastPage ? (
                <Button href={leadsHref({ ...params, page: data.page + 1 })} size="sm">
                  Next
                </Button>
              ) : (
                <Button size="sm" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
