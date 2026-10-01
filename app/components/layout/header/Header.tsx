"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Logo from "@/public/images/awtomatig-full-logo.png";
import { Button } from "@/app/components/ui";
import { WhatsAppIcon } from "@/app/components/icons";

const NAV_LINKS = [
  { href: "#home", label: "Home", active: true },
  { href: "#services", label: "Services" },
  { href: "#case-studies", label: "Case Studies" },
  { href: "#contact", label: "Contact" },
  { href: "#about", label: "About" },
];

// Replace with your WhatsApp link, e.g. https://wa.me/<number>
const WHATSAPP_URL = "#contact";

// Scroll distance (px) after which the header turns into the floating pill
const SCROLL_THRESHOLD = 8;

const TOGGLE_BAR =
  "block h-1.5 w-16 rounded-full bg-white transition-[translate,rotate,opacity] duration-350 ease-out-quint motion-reduce:transition-none";

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function useIsScrolled() {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > SCROLL_THRESHOLD,
    () => false,
  );
}

export default function Header() {
  const isScrolled = useIsScrolled();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close the mobile menu on Escape or on a tap outside the header
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setIsMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      ref={headerRef}
      className="site-header group fixed inset-x-0 top-0 z-50"
      data-scrolled={isScrolled || undefined}
      data-open={isMenuOpen || undefined}
    >
      <div className="site-container">
        <div className="nav-pill relative isolate flex h-52 items-center justify-between pr-8 pl-12 lg:h-60 lg:pr-10 lg:pl-18">
          <a href="#home" className="block" aria-label="AWTOMATIG home" onClick={closeMenu}>
            {/* 2x the ~106x36 display size; the source PNG is 3239x1099 */}
            <Image src={Logo} alt="AWTOMATIG" width={260} height={100} priority className="h-30 w-auto lg:h-36" />
          </a>

          {/* Centred on the pill itself, independent of the logo and button widths */}
          <nav className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 gap-36 lg:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={link.active ? "page" : undefined}
                className="type-body-14 text-fg-inverse transition-colors duration-200 hover:text-action-primary motion-reduce:transition-none"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-8">
            <Button href={WHATSAPP_URL} variant="tint" size="md" icon={<WhatsAppIcon />} className="nav-cta">
              Message Us
            </Button>

            {/* 36px visual, 44px touch target (before:-inset-4) */}
            <button
              type="button"
              className="relative inline-flex size-36 flex-col items-center justify-center gap-4 rounded-6 bg-black/20 transition-colors duration-200 before:absolute before:-inset-4 hover:bg-black/40 motion-reduce:transition-none lg:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span className={`${TOGGLE_BAR} group-data-open:translate-y-5.5 group-data-open:rotate-45`} />
              <span className={`${TOGGLE_BAR} group-data-open:opacity-0`} />
              <span className={`${TOGGLE_BAR} group-data-open:-translate-y-5.5 group-data-open:-rotate-45`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet dropdown */}
      <div id="mobile-menu" className="nav-menu glass rounded-12 p-8 lg:hidden" inert={!isMenuOpen}>
        <nav className="flex flex-col" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              onClick={closeMenu}
              className="type-body-16 rounded-8 border-t border-white/12 p-12 text-white/60 transition-colors duration-200 first:border-t-0 hover:bg-white/12 hover:text-action-primary aria-[current=page]:text-fg-inverse motion-reduce:transition-none"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Button
          href={WHATSAPP_URL}
          variant="tint"
          size="lg"
          fullWidth
          icon={<WhatsAppIcon />}
          className="mt-8"
          onClick={closeMenu}
        >
          Message Us
        </Button>
      </div>
    </header>
  );
}
