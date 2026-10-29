"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/cn";
import { NAV } from "@/lib/nav";
import logo from "@/public/images/awtomatig-full-logo.png";

export interface SidebarUser {
  name: string;
  role: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** The charcoal sidebar body: logo, grouped navigation, user. Used by the desktop sidebar and the mobile drawer. */
export function SidebarContent({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="bg-surface-inverse text-fg-inverse flex h-full flex-col">
      <div className="px-24 pt-24 pb-20">
        <Link href="/" aria-label="AWTOMATIG admin home" className="inline-block">
          <Image src={logo} alt="AWTOMATIG" width={140} className="h-auto" priority />
        </Link>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-12 pb-16">
        {NAV.map((group) => (
          <div key={group.label} className="mt-16 first:mt-0">
            <p className="type-caption-12 px-12 pb-8 text-white/40 uppercase">{group.label}</p>
            <ul className="flex flex-col gap-2">
              {group.items.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "type-body-14 rounded-8 ease-out-quint relative flex h-40 items-center gap-12 px-12 transition-colors duration-200 motion-reduce:transition-none",
                        active ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/12 hover:text-white",
                      )}
                    >
                      {active && (
                        <span aria-hidden="true" className="bg-action-primary absolute inset-y-8 left-0 w-2 rounded-full" />
                      )}
                      <Icon strokeWidth={1.5} aria-hidden="true" className="size-18 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-12 border-t border-white/12 px-24 py-16">
        <span
          aria-hidden="true"
          className="type-caption-12 flex size-32 shrink-0 items-center justify-center rounded-full bg-white/12 text-white"
        >
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-body-14 truncate text-white">{user.name}</p>
          <p className="type-caption-12 truncate text-white/60">{user.role}</p>
        </div>
        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => {
            void signOut().finally(() => {
              router.replace("/login");
              router.refresh();
            });
          }}
          className="ease-out-quint rounded-8 relative flex size-32 shrink-0 items-center justify-center text-white/60 transition-colors duration-200 before:absolute before:-inset-6 hover:bg-white/12 hover:text-white motion-reduce:transition-none"
        >
          <LogOut strokeWidth={1.5} aria-hidden="true" className="size-18" />
        </button>
      </div>
    </div>
  );
}
