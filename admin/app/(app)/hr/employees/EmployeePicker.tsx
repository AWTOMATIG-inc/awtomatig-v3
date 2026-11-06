"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Input } from "@/components/ui";
import { api } from "@/lib/api/client";

/** A person chosen in a picker. `label` is what is shown (`EMP-0001 · Jane Doe`), `name` is the name alone. */
export interface PersonRef {
  id: string;
  label: string;
  name: string;
}

interface Match {
  id: string;
  employeeId: string;
  fullName: string;
  designation: string;
}

/**
 * Finds an employee by name, email, phone or EMP ID and picks one. It asks the server for a few matches as you type instead of
 * loading everyone (root rules), and lists only people who are still working. Pass `excludeId` to leave one person out (a
 * manager cannot be their own manager).
 */
export function EmployeePicker({
  id,
  value,
  onChange,
  excludeId,
  disabled,
  invalid,
}: {
  id: string;
  value: PersonRef | null;
  onChange: (person: PersonRef | null) => void;
  excludeId?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(0);

  // Stop a search that is still waiting if the picker goes away.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function search(text: string) {
    setQuery(text);
    setFailed(false);
    if (timer.current) clearTimeout(timer.current);
    const term = text.trim();
    latest.current += 1;
    if (term.length < 2) {
      setMatches(null);
      return;
    }
    const ticket = latest.current;
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.GET("/api/v1/hr/employees", {
          params: { query: { q: term, pageSize: 8, status: "working" } },
        });
        // A slower, older search must not replace a newer one.
        if (ticket !== latest.current) return;
        if (!data) return setFailed(true);
        setMatches(data.items.filter((item) => item.id !== excludeId));
      } catch {
        if (ticket === latest.current) setFailed(true);
      }
    }, 250);
  }

  if (value) {
    return (
      <div className="border-border rounded-6 flex min-h-40 items-center justify-between gap-12 border px-12 py-4">
        <span className="type-body-14 text-fg-strong min-w-0 truncate">{value.label}</span>
        <Button size="sm" disabled={disabled} onClick={() => onChange(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Input
        id={id}
        type="search"
        autoComplete="off"
        placeholder="Search by name, email or EMP ID"
        value={query}
        disabled={disabled}
        invalid={invalid}
        onChange={(event) => search(event.target.value)}
      />
      {failed && <p className="type-body-14 text-fg-muted mt-6">The search did not work. Try again.</p>}
      {matches && matches.length === 0 && <p className="type-body-14 text-fg-muted mt-6">No one working here matches that.</p>}
      {matches && matches.length > 0 && (
        <ul className="border-border rounded-8 mt-6 flex flex-col overflow-hidden border" aria-label="Matching employees">
          {matches.map((match) => (
            <li key={match.id} className="border-border border-t first:border-t-0">
              <button
                type="button"
                className="type-body-14 hover:bg-surface-subtle ease-out-quint flex min-h-44 w-full flex-col items-start justify-center px-12 py-6 text-left transition-colors duration-200 motion-reduce:transition-none"
                onClick={() => {
                  onChange({ id: match.id, label: `${match.employeeId} · ${match.fullName}`, name: match.fullName });
                  setQuery("");
                  setMatches(null);
                }}
              >
                <span className="text-fg-strong font-medium">
                  {match.employeeId} · {match.fullName}
                </span>
                <span className="text-fg-muted">{match.designation}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
