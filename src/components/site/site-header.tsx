import Link from "next/link";
import LogoMark from "@/components/logo-mark";
import HeaderLoginButton from "@/components/header-login-button";
import HeaderProfileMenu from "@/components/header-profile-menu";
import MobileNav from "@/components/mobile-nav";
import HeaderScroll from "@/components/site/header-scroll";
import { PrimaryButton, SecondaryButton } from "@/components/site/buttons";
import { focusRing } from "@/components/site/section";

export interface SiteNavItem {
  label: string;
  href: string;
}

/**
 * Nav for the public site. Anchor links are prefixed with "/" so they
 * route back to the homepage from /pricing, /privacy and /terms.
 */
export const SITE_NAV: SiteNavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
];

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <span className="font-heading text-[22px] font-extrabold leading-none tracking-[-0.03em] text-ink sm:text-[26px]">
        Vertexa QR
      </span>
    </span>
  );
}

/**
 * Shared site header (homepage + MarketingShell pages). Auth state is
 * fetched by the server page and passed in; the Log in modal trigger,
 * profile menu and mobile sheet keep their existing behaviour.
 */
export default function SiteHeader({
  isAuthed,
  userEmail,
}: {
  isAuthed: boolean;
  userEmail: string | null;
}) {
  return (
    <HeaderScroll>
      <div className="mx-auto flex h-[68px] w-full max-w-[1218px] items-center justify-between gap-4 px-4 sm:h-[76px] sm:px-6">
        <Link href="/" aria-label="Vertexa QR home" className={`rounded-lg ${focusRing}`}>
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {SITE_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-2.5 py-2 font-body text-base font-medium text-ink xl:px-3.5 transition-colors duration-200 hover:bg-stone ${focusRing}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <>
              <SecondaryButton href="/dashboard" className="hidden !h-10 sm:inline-flex">
                Dashboard
              </SecondaryButton>
              <PrimaryButton href="/create" className="hidden sm:inline-flex">
                Create QR code
              </PrimaryButton>
              <HeaderProfileMenu email={userEmail} />
            </>
          ) : (
            <>
              <HeaderLoginButton />
              <PrimaryButton href="/create" className="hidden sm:inline-flex">
                Create QR code
              </PrimaryButton>
            </>
          )}
          {/* Mobile: compact text-only "Create QR code" next to the menu. */}
          <Link
            href="/create"
            className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-lime px-3.5 font-body text-sm font-medium text-ink transition-colors duration-200 hover:bg-lime-deep sm:hidden ${focusRing}`}
          >
            Create QR code
          </Link>
          <MobileNav nav={SITE_NAV} isAuthed={isAuthed} />
        </div>
      </div>
    </HeaderScroll>
  );
}
