import type { ReactNode } from "react";
import BreadcrumbJsonLd from "@/app/components/seo/BreadcrumbJsonLd";
import Footer from "@/app/components/layout/footer/Footer";
import Header from "@/app/components/layout/header/Header";

// Shared chrome for every public page: the navbar (which picks its own light/dark theme from the route) and the
// footer. This layout persists across navigation between (site) pages, so Header keeps its scroll state instead
// of remounting on every link click.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd />
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}
