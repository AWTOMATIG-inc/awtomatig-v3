import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Card, EmptyState, Input, PageHeader, Pagination, Select } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { MAX_REORDERABLE } from "@/lib/cms/case-studies";
import {
  isTestimonialListReorderable,
  parseTestimonialParams,
  TESTIMONIAL_STATUS_LABEL,
  TESTIMONIAL_STATUSES,
  TESTIMONIALS_PAGE_SIZE,
  testimonialsHref,
} from "@/lib/cms/testimonials";

import { TestimonialsTable } from "./TestimonialsTable";

export const metadata: Metadata = { title: "Testimonials" };

/** The website's client testimonials: search and status filter above, then the table with paging underneath. */
export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = parseTestimonialParams(await searchParams);

  if (!can(session, "cms.testimonial.read")) {
    return (
      <>
        <PageHeader title="Testimonials" />
        <Card>
          <EmptyState>
            You do not have access to testimonials. Ask an administrator to add the testimonial permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data, response } = await (
    await serverApi()
  ).GET("/api/v1/cms/testimonials", {
    params: {
      query: {
        page: params.page,
        pageSize: TESTIMONIALS_PAGE_SIZE,
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
  // A link to a page that no longer exists (testimonials were filtered or deleted): go to the last real one.
  if (data && data.items.length === 0 && data.total > 0 && params.page > lastPage)
    redirect(testimonialsHref({ ...params, page: lastPage }));

  const canUpdate = can(session, "cms.testimonial.update");
  const reorderable = isTestimonialListReorderable(params);

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="The “Client testimonials” cards on the website's Home and About pages. Drafts are only visible here."
        actions={
          can(session, "cms.testimonial.create") ? (
            <Button href="/cms/testimonials/new" variant="primary" icon={<Plus strokeWidth={1.5} />}>
              New testimonial
            </Button>
          ) : undefined
        }
      />

      <Card aria-label="Testimonials">
        <form method="get" action="/cms/testimonials" className="flex flex-wrap items-end gap-12 p-16">
          <div className="w-full sm:w-320">
            <label htmlFor="q" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Search
            </label>
            <Input id="q" name="q" type="search" defaultValue={params.q} placeholder="Name, company or quote" />
          </div>
          <div className="w-full sm:w-200">
            <label htmlFor="status" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Status
            </label>
            <Select id="status" name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option>
              {TESTIMONIAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {TESTIMONIAL_STATUS_LABEL[status]}
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
            <Button href="/cms/testimonials" variant="outline">
              Clear
            </Button>
          )}
        </form>

        <div className="border-border border-t">
          {data ? (
            <TestimonialsTable
              testimonials={data.items}
              params={params}
              firstPosition={(data.page - 1) * data.pageSize}
              total={data.total}
              canUpdate={canUpdate}
              canDelete={can(session, "cms.testimonial.delete")}
              reorderable={reorderable && data.total <= MAX_REORDERABLE}
            />
          ) : (
            <EmptyState action={<Button href={testimonialsHref(params)}>Try again</Button>}>
              {response.status === 403 ? "You do not have access to testimonials." : "The testimonials could not be loaded."}
            </EmptyState>
          )}
        </div>

        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            hrefFor={(page) => testimonialsHref({ ...params, page })}
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
