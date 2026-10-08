import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/images/awtomatig-full-logo-dark.png";
import { Button } from "@/app/components/ui";
import { MailIcon, WhatsAppIcon } from "@/app/components/icons";

// Placeholders until the real destinations exist (MEMORY.md §4)
const WHATSAPP_URL = "#contact";
const EMAIL_URL = "mailto:hello@awtomatig.com";

const LINK_COLUMNS = [
  {
    label: "Pages",
    links: [
      { href: "/", label: "Home" },
      { href: "/services", label: "Services" },
      { href: "/case-studies", label: "Case Studies" },
      { href: "/contact", label: "Contact" },
      { href: "/about", label: "About" },
    ],
  },
  {
    label: "Services",
    // Phones: the long service names get a full row, below Pages and Elsewhere
    className: "max-sm:order-1 max-sm:col-span-full",
    links: [
      { href: "/#website-infrastructure", label: "Website Infrastructure" },
      { href: "/#back-office-operations", label: "Back-Office Operations" },
      { href: "/#erp-business-systems", label: "ERP & Business Systems" },
      { href: "/#ad-tech", label: "AdTech" },
    ],
  },
  {
    label: "Elsewhere",
    links: [
      { href: "#", label: "AWLABS" },
      { href: "#", label: "LinkedIn" },
    ],
  },
];

const LEGAL_LINKS = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms & Conditions" },
];

const HAIRLINE = "border-t border-border";

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-surface-subtle text-fg-strong">
      <div className="site-container @container">
        {/* Logo, statement and intro */}
        <div className="grid gap-32 pt-60 pb-40 lg:grid-cols-[346fr_565fr_409fr] lg:gap-0 lg:pt-98 lg:pb-60">
          <Link href="/" className="block self-start" aria-label="AWTOMATIG home">
            {/* 2x the 213x72 display size; the source PNG is 3239x1099 */}
            <Image src={Logo} alt="AWTOMATIG" width={426} height={145} className="h-56 w-auto lg:h-72" />
          </Link>
          <p className="type-heading-60 max-w-[8em] text-fg-strong">Connecting the systems that keep business moving.</p>
          <p className="type-body-16 max-w-410 self-end text-fg-strong">
            We help businesses build, connect and operate the systems behind growth from digital infrastructure and
            back-office operations to ERP and AdTech.
          </p>
        </div>

        {/* Link columns and contact actions */}
        <div
          className={`${HAIRLINE} grid grid-cols-2 gap-x-20 gap-y-40 pt-40 pb-40 sm:grid-cols-3 lg:grid-cols-[281fr_396fr_234fr_409fr] lg:gap-0 lg:pt-72 lg:pb-74`}
        >
          {LINK_COLUMNS.map((column) => (
            <nav key={column.label} aria-label={column.label} className={column.className}>
              <ul className="flex flex-col lg:gap-19">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {/* py-10 gives a 46px touch target below lg */}
                    <Link
                      href={link.href}
                      className="type-heading-20 lg:type-heading-24 inline-block py-10 text-fg-strong lg:py-0 transition-colors duration-200 hover:text-black/60 motion-reduce:transition-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-full flex flex-col gap-12 max-sm:order-2 lg:col-span-1 lg:pt-6">
            <Button href="#contact" variant="primary" size="xl" fullWidth>
              Start a conversation
            </Button>
            <Button href={WHATSAPP_URL} variant="light" size="xl" fullWidth icon={<WhatsAppIcon />}>
              Message us
            </Button>
            <Button href={EMAIL_URL} variant="outline" size="xl" fullWidth icon={<MailIcon />}>
              Email us
            </Button>
          </div>
        </div>

        {/* Copyright and legal */}
        <div
          className={`${HAIRLINE} flex flex-col gap-6 pt-32 text-fg-strong sm:flex-row sm:items-center sm:justify-between`}
        >
          <p className="type-body-16">© {new Date().getFullYear()} AWTOMATIG. All rights reserved.</p>
          <ul className="type-body-16 flex items-center gap-12 sm:-my-10">
            {LEGAL_LINKS.map((link, i) => (
              <li key={link.label} className="flex items-center gap-12">
                {i > 0 && <span aria-hidden="true">•</span>}
                <a href={link.href} className="inline-block py-10 transition-colors duration-200 hover:text-cyan/80 motion-reduce:transition-none">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Wordmark: spans the container width and sits on the bottom edge (descender clipped) */}
        <p aria-hidden="true" className="type-wordmark mt-32 text-fg-strong select-none lg:mt-37">
          AWTOMATIG
        </p>
      </div>
    </footer>
  );
}
