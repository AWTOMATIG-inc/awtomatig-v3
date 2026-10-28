import { SidebarContent, type SidebarUser } from "./SidebarContent";

/** The fixed desktop sidebar (from `lg`). Below `lg` the same content opens as a drawer (MobileNav). */
export function Sidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-(--admin-sidebar-w) shrink-0 lg:block">
      <SidebarContent user={user} />
    </aside>
  );
}
