import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Card, EmptyState, Input, PageHeader, Pagination, Select } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";
import { MAX_REORDERABLE } from "@/lib/cms/case-studies";
import {
  FAQ_PAGES,
  FAQ_STATUS_LABEL,
  FAQ_STATUSES,
  FAQS_PAGE_SIZE,
  faqsHref,
  isFaqListReorderable,
  parseFaqParams,
} from "@/lib/cms/faqs";

import { FaqsTable } from "./FaqsTable";

export const metadata: Metadata = { title: "FAQs" };

/** The website's shared FAQ list: search and status filter above, then the table with paging underneath. */
export default async function FaqsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  const params = parseFaqParams(await searchParams);

  if (!can(session, "cms.faq.read")) {
    return (
      <>
        <PageHeader title="FAQs" />
        <Card>
          <EmptyState>You do not have access to FAQs. Ask an administrator to add the FAQ permission to your role.</EmptyState>
        </Card>
      </>
    );
  }

  const { data, response } = await (
    await serverApi()
  ).GET("/api/v1/cms/faqs", {
    params: {
      query: {
        page: params.page,
        pageSize: FAQS_PAGE_SIZE,
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
  // A link to a page that no longer exists (FAQs were filtered or deleted): go to the last real one.
  if (data && data.items.length === 0 && data.total > 0 && params.page > lastPage)
    redirect(faqsHref({ ...params, page: lastPage }));

  const canUpdate = can(session, "cms.faq.update");
  const reorderable = isFaqListReorderable(params);

  return (
    <>
      <PageHeader
        title="FAQs"
        description={`One list, shown on every page that has the FAQ section (currently: ${FAQ_PAGES}). The cleaning landing page has its own questions. Drafts are only visible here.`}
        actions={
          can(session, "cms.faq.create") ? (
            <Button href="/cms/faqs/new" variant="primary" icon={<Plus strokeWidth={1.5} />}>
              New FAQ
            </Button>
          ) : undefined
        }
      />

      <Card aria-label="FAQs">
        <form method="get" action="/cms/faqs" className="flex flex-wrap items-end gap-12 p-16">
          <div className="w-full sm:w-320">
            <label htmlFor="q" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Search
            </label>
            <Input id="q" name="q" type="search" defaultValue={params.q} placeholder="Question or answer" />
          </div>
          <div className="w-full sm:w-200">
            <label htmlFor="status" className="type-body-14 text-fg-strong mb-6 block font-medium">
              Status
            </label>
            <Select id="status" name="status" defaultValue={params.status ?? ""}>
              <option value="">All statuses</option>
              {FAQ_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {FAQ_STATUS_LABEL[status]}
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
            <Button href="/cms/faqs" variant="outline">
              Clear
            </Button>
          )}
        </form>

        <div className="border-border border-t">
          {data ? (
            <FaqsTable
              faqs={data.items}
              params={params}
              firstPosition={(data.page - 1) * data.pageSize}
              total={data.total}
              canUpdate={canUpdate}
              canDelete={can(session, "cms.faq.delete")}
              reorderable={reorderable && data.total <= MAX_REORDERABLE}
            />
          ) : (
            <EmptyState action={<Button href={faqsHref(params)}>Try again</Button>}>
              {response.status === 403 ? "You do not have access to FAQs." : "The FAQs could not be loaded."}
            </EmptyState>
          )}
        </div>

        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            hrefFor={(page) => faqsHref({ ...params, page })}
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
