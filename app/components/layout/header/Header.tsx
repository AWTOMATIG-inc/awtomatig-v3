"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/public/images/awtomatig-full-logo.png";
import { Button } from "@/app/components/ui";
import { WhatsAppIcon } from "@/app/components/icons";

// Pages are routes; sections that only exist on Home are "/#…" anchors until they get their own page
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/#contact", label: "Contact" },
  { href: "/#about", label: "About" },
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

// The header always shows above this scroll offset (px)
const HIDE_AFTER = 120;
// Scroll distance (px) in one direction needed to hide or reveal the header
const DIRECTION_TOLERANCE = 8;

// Hides the header while scrolling down and reveals it on any scroll up
function useHideOnScroll() {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      // Clamp to the real scroll range so iOS overscroll bounce doesn't count as a direction change
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.min(Math.max(window.scrollY, 0), maxY);

      if (y < HIDE_AFTER) setIsHidden(false);
      else if (y - lastY > DIRECTION_TOLERANCE) setIsHidden(true);
      else if (lastY - y > DIRECTION_TOLERANCE) setIsHidden(false);
      // Too small to count yet: keep the reference point so slow scrolls add up
      else return;

      lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return [isHidden, () => setIsHidden(false)] as const;
}

export default function Header() {
  const isScrolled = useIsScrolled();
  const [isScrolledAway, showHeader] = useHideOnScroll();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Never hide while the mobile menu is open
  const isHidden = isScrolledAway && !isMenuOpen;
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
  const pathname = usePathname();

  return (
    <header
      ref={headerRef}
      className="group fixed inset-x-0 top-0 z-50 pt-safe-12 transition-[padding,translate,opacity] duration-450 ease-out-quint data-hidden:-translate-y-full data-hidden:opacity-0 data-scrolled:pt-safe-8 motion-reduce:transition-none lg:frame-scale lg:pt-safe-20 lg:data-scrolled:pt-safe-12"
      data-scrolled={isScrolled || undefined}
      data-hidden={isHidden || undefined}
      data-open={isMenuOpen || undefined}
      // Keyboard users tabbing into a hidden header bring it back
      onFocus={showHeader}
    >
      <div className="site-container">
        <div className="relative isolate flex h-52 items-center justify-between pr-8 pl-12 lg:h-60 lg:pr-10 lg:pl-18">
          {/* Glass surface: fades in once the page is scrolled or the menu is open */}
          <span
            aria-hidden="true"
            className="glass pointer-events-none absolute inset-0 -z-1 scale-98 rounded-10 opacity-0 transition-[opacity,scale] duration-450 ease-out-quint group-data-open:scale-100 group-data-open:opacity-100 group-data-scrolled:scale-100 group-data-scrolled:opacity-100 motion-reduce:transition-none"
          />

          <Link href="/" className="block" aria-label="AWTOMATIG home" onClick={closeMenu}>
            {/* 2x the ~106x36 display size; the source PNG is 3239x1099 */}
            <Image src={Logo} alt="AWTOMATIG" width={260} height={100} priority className="h-30 w-auto lg:h-36" />
          </Link>

          {/* Centred on the pill itself, independent of the logo and button widths */}
          <nav className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 gap-36 lg:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.href === pathname ? "page" : undefined}
                className="type-body-14 text-fg-inverse transition-colors duration-200 hover:text-action-primary motion-reduce:transition-none"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-8">
            <Button href={WHATSAPP_URL} variant="tint" size="nav" icon={<WhatsAppIcon />} className="lg:w-142">
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

          {/* Mobile / tablet dropdown, aligned to the pill's edges */}
          <div
            id="mobile-menu"
            inert={!isMenuOpen}
            className="glass glass-dense pointer-events-none absolute inset-x-0 top-full mt-8 origin-top -translate-y-8 scale-98 rounded-12 p-8 opacity-0 transition-[opacity,translate,scale] duration-350 ease-out-quint group-data-open:pointer-events-auto group-data-open:translate-y-0 group-data-open:scale-100 group-data-open:opacity-100 motion-reduce:transition-none lg:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={link.href === pathname ? "page" : undefined}
                  onClick={closeMenu}
                  className="type-body-16 rounded-8 border-t border-white/12 p-12 text-white/60 transition-colors duration-200 first:border-t-0 hover:bg-white/12 hover:text-action-primary aria-[current=page]:text-fg-inverse motion-reduce:transition-none"
                >
                  {link.label}
                </Link>
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
        </div>
      </div>
    </header>
  );
}
