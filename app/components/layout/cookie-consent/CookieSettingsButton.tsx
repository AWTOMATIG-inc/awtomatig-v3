"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/consent";

/** Footer link that reopens the cookie banner, so a choice can be changed or withdrawn */
export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      Cookie settings
    </button>
  );
}
