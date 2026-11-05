"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Dialog, Field, Input } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";
import { metricValueProblem, placementUrl, type SiteMetric } from "@/lib/cms/site-metrics";

/** Renders nothing until a figure is chosen; each figure gets a fresh editor, so no state carries over from the last one. */
export function SiteMetricDialog({ metric, onClose }: { metric: SiteMetric | null; onClose: () => void }) {
  return metric ? <MetricEditor key={metric.key} metric={metric} onClose={onClose} /> : null;
}

/**
 * Edits one trust number. It shows the field title, the current value, every page and section where the figure appears (with
 * a link to open each page) and a note when the figure is shared. Saving goes live at once, so the dialog says so.
 */
function MetricEditor({ metric, onClose }: { metric: SiteMetric; onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState(metric.value);
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const problem = metricValueProblem(metric, value);
  const unchanged = value.trim() === metric.value;
  const pages = new Set(metric.placements.map((placement) => placement.page)).size;

  async function save() {
    if (problem || unchanged) {
      setTouched(true);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { response, error: failure } = await api.PATCH("/api/v1/cms/site-metrics/{key}", {
        params: { path: { key: metric.key } },
        body: { value: value.trim() },
      });
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) {
        setError(
          response.status === 403
            ? "You do not have permission to do this."
            : apiMessage(failure, "That did not work. Try again."),
        );
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit “${metric.title}”`}
      actions={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={pending || unchanged || Boolean(problem)}>
            {pending ? "Saving" : "Save and publish"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        noValidate
      >
        <Field
          id="metric-value"
          label={metric.title}
          helper={`${metric.hint}. Now: ${metric.value}`}
          error={touched && problem ? problem : undefined}
        >
          <Input
            id="metric-value"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setTouched(true);
            }}
            invalid={touched && Boolean(problem)}
            autoComplete="off"
            maxLength={12}
            autoFocus
          />
        </Field>

        <p className="type-body-14 text-fg-strong mt-20 font-medium">Appears on</p>
        <ul className="mt-8 flex flex-col gap-8">
          {metric.placements.map((placement) => (
            <li key={`${placement.route}-${placement.section}`} className="type-body-14 flex items-start justify-between gap-12">
              <span>
                <span className="text-fg-strong font-medium">{placement.page}</span>
                <span className="text-fg-muted"> · {placement.section}</span>
              </span>
              <a
                href={placementUrl(placement)}
                target="_blank"
                rel="noreferrer"
                className="text-fg-primary inline-flex shrink-0 items-center gap-4 underline underline-offset-4"
                aria-label={`Open ${placement.page} in a new tab`}
              >
                Open <ExternalLink aria-hidden="true" className="size-14" strokeWidth={1.5} />
              </a>
            </li>
          ))}
        </ul>
        {metric.placements.length > 1 && (
          <p className="type-body-14 text-fg-muted mt-12">
            This figure is shared: changing it updates {metric.placements.length} places on{" "}
            {pages === 1 ? "one page" : `${pages} pages`}.
          </p>
        )}
        <p className="type-body-14 text-fg-muted mt-12">
          There is no draft: saving shows the new figure on the website within seconds.
        </p>

        {error && (
          <p role="alert" className="text-fg-primary mt-12 flex items-start gap-8">
            <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
            {error}
          </p>
        )}
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
