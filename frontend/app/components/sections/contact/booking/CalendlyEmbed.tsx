"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
const STYLE_HREF = "https://assets.calendly.com/assets/external/widget.css";

type CalendlyWindow = Window & {
  Calendly?: { initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void };
};

// Calendly's snippet only auto-initialises its widget div once, at script load; a client-side navigation back to this
// page would leave an empty box. So the script is loaded on demand and the widget is initialised from the effect.
function loadCalendly(): Promise<NonNullable<CalendlyWindow["Calendly"]>> {
  const w = window as CalendlyWindow;
  if (w.Calendly) return Promise.resolve(w.Calendly);

  if (!document.querySelector(`link[href="${STYLE_HREF}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLE_HREF;
    document.head.appendChild(link);
  }

  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", () => (w.Calendly ? resolve(w.Calendly) : reject(new Error("Calendly missing"))));
    script.addEventListener("error", () => reject(new Error("Calendly failed to load")));
  });
}

/** Calendly inline scheduler. Falls back to a plain link if the script is blocked or fails to load. */
export default function CalendlyEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const parent = ref.current;
    if (!parent) return;
    let cancelled = false;
    loadCalendly()
      .then((calendly) => {
        if (cancelled) return;
        parent.replaceChildren();
        calendly.initInlineWidget({ url, parentElement: parent });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      parent.replaceChildren();
    };
  }, [url]);

  // Calendly leaves ~56px of blank space above its card; the inner box is pulled up so the outer one crops it
  return (
    <div className="relative h-640 min-w-320 overflow-hidden">
      <div ref={ref} className="absolute inset-x-0 -top-56 -bottom-24" />
      {failed && (
        <p className="type-body-16 text-fg-primary absolute inset-0 flex items-center justify-start text-center">
          <span>
            The scheduler could not load.{" "}
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              Open it in a new tab
            </a>
            .
          </span>
        </p>
      )}
    </div>
  );
}
