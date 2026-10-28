"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { SidebarContent, type SidebarUser } from "./SidebarContent";

/**
 * The sidebar as a drawer below `lg`. A native modal <dialog> gives focus trapping, Esc to close and focus return for
 * free; it also closes when the route changes.
 */
export function MobileNav({ user }: { user: SidebarUser }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => dialog.current?.showModal()}
        className="rounded-6 text-fg-strong ease-out-quint hover:bg-surface-subtle relative flex size-36 items-center justify-center transition-colors duration-200 before:absolute before:-inset-4 motion-reduce:transition-none"
      >
        <Menu strokeWidth={1.5} aria-hidden="true" className="size-20" />
      </button>

      <dialog
        ref={dialog}
        aria-label="Menu"
        className="bg-surface-inverse m-0 h-dvh max-h-none w-(--admin-sidebar-w) max-w-full p-0 backdrop:bg-black/40 open:block"
        onClick={(event) => {
          // A click on the backdrop lands on the <dialog> element itself.
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="relative h-full">
          <SidebarContent user={user} />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => dialog.current?.close()}
            className="rounded-6 ease-out-quint absolute top-16 right-12 flex size-36 items-center justify-center text-white/60 transition-colors duration-200 before:absolute before:-inset-4 hover:bg-white/12 hover:text-white motion-reduce:transition-none"
          >
            <X strokeWidth={1.5} aria-hidden="true" className="size-20" />
          </button>
        </div>
      </dialog>
    </div>
  );
}
