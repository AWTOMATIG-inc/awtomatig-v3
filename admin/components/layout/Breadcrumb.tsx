"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAME } from "@/lib/config";
import { findNavItem } from "@/lib/nav";

/** Where you are: the app, then the current screen. Deeper levels are added here as modules get detail pages. */
export function Breadcrumb() {
  const current = findNavItem(usePathname());

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="type-body-14 text-fg-muted flex items-center gap-8">
        <li className="shrink-0">
          <Link
            href="/"
            className="ease-out-quint hover:text-fg-strong transition-colors duration-200 motion-reduce:transition-none"
          >
            {APP_NAME}
          </Link>
        </li>
        {current && (
          <li className="flex min-w-0 items-center gap-8">
            <ChevronRight strokeWidth={1.5} aria-hidden="true" className="size-16 shrink-0" />
            <span aria-current="page" className="text-fg-strong truncate">
              {current.label}
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}
