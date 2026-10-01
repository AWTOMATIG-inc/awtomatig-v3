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
      className="site-header fixed inset-x-0 top-0 z-50"
      data-scrolled={isScrolled || undefined}
      data-open={isMenuOpen || undefined}
    >
      <div className="site-container">
        <div className="nav-pill">
          <a href="#home" className="nav-logo" aria-label="AWTOMATIG home" onClick={closeMenu}>
            {/* 2x the ~106x36 display size; the source PNG is 3239x1099 */}
            <Image src={Logo} alt="AWTOMATIG" width={260} height={100} priority />
          </a>

          <nav className="nav-links" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={link.active ? "is-active" : undefined}
                aria-current={link.active ? "page" : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <Button href={WHATSAPP_URL} variant="tint" size="md" icon={<WhatsAppIcon />} className="nav-cta">
              Message Us
            </Button>

            <button
              type="button"
              className="nav-toggle"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet dropdown */}
      <div id="mobile-menu" className="nav-menu" inert={!isMenuOpen}>
        <nav className="nav-menu-links" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={link.active ? "is-active" : undefined}
              aria-current={link.active ? "page" : undefined}
              onClick={closeMenu}
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
          className="nav-menu-cta"
          onClick={closeMenu}
        >
          Message Us
        </Button>
      </div>
    </header>
  );
}
