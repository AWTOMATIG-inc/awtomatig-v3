import { Breadcrumb } from "./Breadcrumb";
import { MobileNav } from "./MobileNav";
import type { SidebarUser } from "./SidebarContent";

/** 56px, white, hairline below. The breadcrumb on the left and nothing else until there is something real to put here. */
export function Topbar({ user }: { user: SidebarUser }) {
  return (
    <header className="border-border bg-surface sticky top-0 z-10 flex h-(--admin-topbar-h) items-center gap-12 border-b px-16 lg:px-24 xl:px-32">
      <MobileNav user={user} />
      <Breadcrumb />
    </header>
  );
}
