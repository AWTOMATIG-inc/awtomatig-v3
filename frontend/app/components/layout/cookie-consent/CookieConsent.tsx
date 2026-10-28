"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/app/components/ui";
import { CONSENT_EVENT, OPEN_CONSENT_EVENT, readConsent, saveConsent, type ConsentChoice } from "@/lib/consent";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CONSENT_EVENT, onChange);
  };
}

/** Cookie banner: shown until the visitor accepts or rejects, and again from the footer's "Cookie settings" */
export default function CookieConsent() {
  // "pending" on the server and during hydration, so the banner never flashes for visitors who already chose
  const choice = useSyncExternalStore(subscribe, readConsent, () => "pending" as const);
  const [reopened, setReopened] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  useEffect(() => {
    if (reopened) panel.current?.focus();
  }, [reopened]);

  if (choice === "pending" || (choice !== null && !reopened)) return null;

  const choose = (value: ConsentChoice) => {
    saveConsent(value);
    setReopened(false);
  };

  return (
    <div
      ref={panel}
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-text"
      tabIndex={-1}
      className="bg-surface-inverse text-fg-inverse rounded-12 shadow-card fixed inset-x-16 bottom-16 z-50 border border-white/12 p-20 outline-none sm:right-auto sm:max-w-400 lg:bottom-24 lg:left-24"
    >
      <h2 id="cookie-consent-title" className="type-heading-18">
        Cookies
      </h2>
      <p id="cookie-consent-text" className="type-body-14 mt-8 text-white/60">
        We use Google Analytics and Microsoft Clarity to see how the site is used. They only set cookies if you accept. See our{" "}
        <Link href="/privacy" className="text-fg-inverse underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-16 flex gap-8">
        <Button variant="light" size="card" className="flex-1" onClick={() => choose("granted")}>
          Accept
        </Button>
        <Button variant="glass" size="card" className="flex-1" onClick={() => choose("denied")}>
          Reject
        </Button>
      </div>
    </div>
  );
}
