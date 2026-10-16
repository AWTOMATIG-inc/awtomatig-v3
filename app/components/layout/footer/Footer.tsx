import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/images/awtomatig-full-logo-dark.png";
import { Button } from "@/app/components/ui";
import { MailIcon, WhatsAppIcon } from "@/app/components/icons";
import { FOOTER_PAGES, MAILTO, SITE } from "@/lib/site";
import { SERVICES } from "@/lib/services";
import Wordmark from "./Wordmark";

// Links whose destination doesn't exist yet are left out (see SITE in lib/site.ts)
const SERVICE_LINKS = [
  ...SERVICES.map((service) => ({ href: `/#${service.id}`, label: service.name })),
  { href: SITE.social.awlabs, label: "AWLABS" },
].filter((link): link is { href: string; label: string } => Boolean(link.href));

const ELSEWHERE = [
  { href: SITE.social.linkedin, label: "LinkedIn" },
  { href: SITE.social.instagram, label: "Instagram" },
  { href: SITE.social.x, label: "X" },
  { href: SITE.social.medium, label: "Medium" },
].filter((link): link is { href: string; label: string } => Boolean(link.href));

const LINK_COLUMNS = [
  { label: "Pages", links: FOOTER_PAGES },
  { label: "Services", links: SERVICE_LINKS },
  { label: "Elsewhere", links: ELSEWHERE },
];

// Opens the visitor's email app with a newsletter request (no backend yet, see MEMORY.md)
const NEWSLETTER_MAILTO = `${MAILTO}?subject=${encodeURIComponent("Newsletter signup")}`;

const HAIRLINE = "border-t border-border";

export default function Footer() {
  return (
    <footer className="bg-surface-subtle text-fg-strong overflow-hidden">
      <div className="site-container @container">
        {/* Logo, statement and intro */}
        <div className="grid gap-32 pt-60 pb-40 lg:grid-cols-[346fr_565fr_409fr] lg:gap-0 lg:pt-98 lg:pb-60">
          <Link href="/" className="block self-start" aria-label="AWTOMATIG home">
            {/* 2x the 213x72 display size; the source PNG is 3239x1099 */}
            <Image src={Logo} alt="AWTOMATIG" width={426} height={145} className="h-56 w-auto lg:h-72" />
          </Link>
          <p className="type-heading-60 text-fg-strong max-w-[8em]">Connecting the systems that keep business moving.</p>
          <p className="type-body-16 text-fg-strong max-w-410 self-end">
            We help businesses build, connect and operate the systems behind growth from digital infrastructure and back-office
            operations to ERP and AdTech.
          </p>
        </div>

        {/* Link columns and contact actions */}
        <div
          className={`sm:border-border grid grid-cols-[5fr_6fr] gap-x-8 gap-y-40 pb-60 sm:grid-cols-3 sm:gap-x-20 sm:border-t sm:pt-40 sm:pb-40 lg:grid-cols-[281fr_396fr_234fr_409fr] lg:gap-0 lg:pt-72 lg:pb-74`}
        >
          {LINK_COLUMNS.map((column) =>
            column.links.length === 0 ? (
              // Keeps the desktop column grid while a column has no live links yet
              <div key={column.label} aria-hidden="true" className="max-sm:hidden" />
            ) : (
              <nav key={column.label} aria-label={column.label}>
                <ul className="flex flex-col lg:gap-19">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {/* Below lg the rows sit 34px apart; the pseudo-element extends the hit area to 44px */}
                      <Link
                        href={link.href}
                        {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="type-heading-18 lg:type-heading-24 text-fg-strong relative inline-block py-4 transition-colors duration-200 before:absolute before:inset-x-0 before:-inset-y-5 hover:text-black/60 motion-reduce:transition-none max-lg:tracking-tight max-lg:whitespace-nowrap lg:py-0 lg:before:hidden"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ),
          )}

          <div className="col-span-full flex flex-col gap-12 max-sm:order-2 lg:col-span-1 lg:pt-6">
            <Button href="/contact" variant="primary" size="xl" fullWidth>
              Start a conversation
            </Button>
            {SITE.whatsappUrl && (
              <Button href={SITE.whatsappUrl} variant="dark" size="xl" fullWidth icon={<WhatsAppIcon />}>
                Message us
              </Button>
            )}
            <Button href={MAILTO} variant="light" size="xl" fullWidth icon={<MailIcon />}>
              Email us
            </Button>
            <Button href={NEWSLETTER_MAILTO} variant="outline" size="xl" fullWidth icon={<MailIcon />}>
              Newsletter
            </Button>
          </div>
        </div>

        {/* Copyright and legal */}
        <div
          className={`${HAIRLINE} text-fg-strong flex flex-col-reverse items-center gap-6 pt-10 text-center sm:flex-row sm:justify-between sm:pt-32 sm:text-left`}
        >
          <p className="type-body-16">© {new Date().getFullYear()} AWTOMATIG. All rights reserved.</p>
          <ul className="type-body-16 flex items-center gap-12 sm:-my-10">
            {SITE.legal.map((link, i) => (
              <li key={link.label} className="flex items-center gap-12">
                {i > 0 && <span aria-hidden="true">•</span>}
                <Link
                  href={link.href}
                  className="inline-block py-10 transition-colors duration-200 hover:text-black/60 motion-reduce:transition-none"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Wordmark: spans the container width and sits on the bottom edge (descender clipped) */}
        <Wordmark className="type-wordmark text-fg-strong mt-32 select-none lg:mt-37" />
      </div>
    </footer>
  );
}
