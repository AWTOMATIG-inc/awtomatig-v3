import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { serverApi } from "@/lib/api/server";
import { can, requireSession } from "@/lib/auth/session";

import { SiteMetricsTable } from "./SiteMetricsTable";

export const metadata: Metadata = { title: "Site Metrics" };

/** The website's trust numbers (years of experience, businesses supported, ratings). Each row says which pages show it. */
export default async function SiteMetricsPage() {
  const session = await requireSession();

  if (!can(session, "cms.metric.read")) {
    return (
      <>
        <PageHeader title="Site Metrics" />
        <Card>
          <EmptyState>
            You do not have access to site metrics. Ask an administrator to add the metric permission to your role.
          </EmptyState>
        </Card>
      </>
    );
  }

  const { data, response } = await (await serverApi()).GET("/api/v1/cms/site-metrics");
  if (response.status === 401) redirect("/login");

  return (
    <>
      <PageHeader
        title="Site Metrics"
        description="The trust numbers shown across the website. A change goes live on every page listed in “Shown on” within seconds; there is no draft."
      />
      <Card aria-label="Site metrics">
        {data ? (
          <SiteMetricsTable metrics={data.items} canUpdate={can(session, "cms.metric.update")} />
        ) : (
          <EmptyState action={<Button href="/cms/site-metrics">Try again</Button>}>
            {response.status === 403 ? "You do not have access to site metrics." : "The site metrics could not be loaded."}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
