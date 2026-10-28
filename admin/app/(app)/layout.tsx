import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { requireSession } from "@/lib/auth/session";

/** The signed-in shell (DESIGN.md section 4.2): fixed sidebar from `lg`, a 56px topbar, and the content area on off-white. */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession();

  return (
    <div className="min-h-dvh lg:flex">
      <a
        href="#main"
        className="type-body-14 rounded-6 bg-surface-inverse text-fg-inverse absolute top-8 left-8 z-50 -translate-y-60 px-16 py-8 focus-visible:translate-y-0"
      >
        Skip to content
      </a>
      <Sidebar user={session.user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={session.user} />
        <main id="main" className="flex-1 px-16 py-24 lg:px-24 xl:px-32">
          <div className="max-w-site mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
