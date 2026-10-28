import type { Metadata } from "next";
import Footer from "@/app/components/layout/footer/Footer";
import Header from "@/app/components/layout/header/Header";
import { Button, Eyebrow } from "@/app/components/ui";

// Renders for any URL that doesn't match a route. It sits outside the (site) route group (Next.js falls back to
// the root app/not-found.tsx for an unmatched segment, not a nested layout's), so Header and Footer are composed
// by hand here, same as every (site) page does through the layout. Header has no theme override any more (it
// reads the route itself), and an unmatched path always falls through to its dark default, so this page uses that
// same dark surface instead of forcing a light one.
export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="flex flex-1 flex-col items-center justify-center px-16 py-120 text-center lg:py-180">
        <Eyebrow className="text-fg-inverse">AWTOMATIG</Eyebrow>
        <h1 className="type-display-80 text-fg-inverse mt-24">Page not found.</h1>
        <p className="type-body-16 mt-16 max-w-480 text-white/60">The page you’re looking for doesn’t exist, or has moved.</p>
        <Button href="/" variant="primary" size="lg" className="mt-32">
          Back to home
        </Button>
      </main>
      <Footer />
    </>
  );
}
