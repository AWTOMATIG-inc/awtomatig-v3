"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";
import { api } from "@/lib/api/client";
import { apiMessage } from "@/lib/api/errors";

/**
 * Opens the candidate's resume in a new tab. The file is private: each click asks the backend for a link that works for five
 * minutes (and the backend records the request), then the new tab goes to it. The tab is opened first, in the click itself,
 * because browsers block a window that is opened after waiting for a network reply.
 */
export function ResumeButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setError(null);
    const tab = window.open("about:blank", "_blank");
    setPending(true);
    try {
      const {
        data,
        response,
        error: failure,
      } = await api.GET("/api/v1/recruitment/applications/{id}/resume", {
        params: { path: { id: applicationId } },
      });
      if (response.status === 401) {
        tab?.close();
        return router.replace("/login");
      }
      if (!data) {
        tab?.close();
        return setError(
          response.status === 403
            ? "You do not have permission to open resumes."
            : apiMessage(failure, "The resume could not be opened. Try again."),
        );
      }
      if (!tab) return setError("Your browser blocked the new tab. Allow pop-ups for this site and try again.");
      // The file lives on another site: cut the tab off from this one before it goes there.
      tab.opener = null;
      tab.location.href = data.url;
    } catch {
      tab?.close();
      setError("Cannot reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <Button variant="outline" icon={<FileText strokeWidth={1.5} />} disabled={pending} onClick={open}>
        {pending ? "Opening" : "Open resume"}
      </Button>
      {error && (
        <p role="alert" className="type-body-14 text-fg-primary mt-12 flex items-start gap-8">
          <span aria-hidden="true" className="bg-status-error mt-8 size-6 shrink-0 rounded-full" />
          {error}
        </p>
      )}
    </div>
  );
}
