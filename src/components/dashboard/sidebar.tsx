"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronsUpDown, Home, LogOut, Plus, Settings, type LucideIcon } from "lucide-react";
import LogoMark from "@/components/logo-mark";
import {
  NAV, initials, planUsage,
  type SidebarCurrent, type SidebarMe,
} from "@/components/dashboard/nav";

// B5/Fix 20 — sidebar nav slimmed to 4 items (Overview, QR Codes, Activity,
// Settings). 2026-11 redesign: dark ink rail, lime active pill, "Create QR
// code" primary action, plan card with the real QR count, user card menu.
export type { SidebarCurrent, SidebarMe };

const RING = "focus:outline-none focus-visible:ring-2 focus-visible:ring-lime/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

interface Props {
  me: SidebarMe;
  current: SidebarCurrent;
  /** Where the "Plan details" link in the plan card goes. */
  upgradeHref?: string;
  /** Accepted but unused after Fix 20; kept so existing callers compile. */
  analyticsHref?: string | null;
  /** Same story as analyticsHref — accepted but unused. */
  reportsHref?: string;
}

export default function Sidebar({ me, current, upgradeHref = "/pricing" }: Props) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col bg-ink font-body text-white lg:flex">
      {/* B5/Item 13 — logo click routes to the public site. */}
      <Link
        href="/"
        title="Back to public site"
        className={`mx-3 mt-4 flex items-center gap-2.5 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/5 ${RING}`}
      >
        <LogoMark tone="light" className="h-8 w-8 shrink-0" />
        <span className="font-heading text-[21px] font-extrabold leading-none tracking-[-0.03em] text-white">
          Vertexa QR
        </span>
      </Link>

      <div className="px-3 pt-5">
        <Link
          href="/create"
          className={`group flex h-11 items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-ink transition-colors hover:bg-stone ${RING}`}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-lime transition-transform duration-200 group-hover:translate-x-0.5">
            <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
          Create QR code
        </Link>
      </div>

      <nav aria-label="Dashboard" className="mt-6 flex-1 space-y-1 px-3">
        {NAV.map((n) => {
          const active = n.key === current;
          return (
            /* B5/Round2 C1 — prefetch so sidebar navigation feels instant. */
            <Link
              key={n.key}
              href={n.href}
              prefetch={true}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 items-center gap-3 rounded-full px-4 text-[15px] transition-colors ${RING} ${
                active
                  ? "bg-lime font-medium text-ink"
                  : "text-white/70 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <n.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <PlanCard me={me} upgradeHref={upgradeHref} />
      <ProfileChip me={me} />
    </aside>
  );
}

export function PlanCard({
  me,
  upgradeHref,
  className = "mx-3 mb-3",
}: {
  me: SidebarMe;
  upgradeHref?: string;
  className?: string;
}) {
  const { limit, used, pct } = planUsage(me);
  return (
    <div className={`rounded-[20px] bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-[15px] font-semibold text-white">{me.plan} plan</p>
        <span className="text-xs tabular-nums text-white/60">{pct}%</span>
      </div>
      <p className="mt-1 text-[13px] text-white/65">
        <span className="tabular-nums text-white">{used.toLocaleString()}</span> / {limit.toLocaleString()} QR codes
      </p>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="QR codes used"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
      >
        <div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
      </div>
      {me.plan === "Free" && upgradeHref && (
        <Link
          href={upgradeHref}
          className={`mt-3 inline-flex text-xs font-medium text-white/70 underline-offset-4 hover:text-white hover:underline ${RING} rounded`}
        >
          Plan details
        </Link>
      )}
    </div>
  );
}

// B5/Item 12 — clickable profile chip with a Settings + Sign out menu.
// Outside-click + Escape dismiss; the popover opens above the chip.
function ProfileChip({ me }: { me: SidebarMe }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const showName = me.name && me.name !== me.email;

  return (
    <div ref={rootRef} className="relative border-t border-white/10 p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-white/[0.06] ${RING}`}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime font-heading text-[13px] font-bold text-ink">
          {initials(me)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">{showName ? me.name : me.email}</span>
          {showName && <span className="block truncate text-xs text-white/55">{me.email}</span>}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-2xl border border-stone-dark bg-white p-1.5 text-ink shadow-float"
        >
          <MenuLink href="/dashboard/settings" icon={Settings} onPick={() => setOpen(false)}>
            Settings
          </MenuLink>
          <MenuLink href="/" icon={Home} onPick={() => setOpen(false)}>
            Back to public site
          </MenuLink>
          <form action="/auth/signout" method="post" className="mt-1 border-t border-stone pt-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  onPick,
  children,
}: {
  href: string;
  icon: LucideIcon;
  onPick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onPick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/80 hover:bg-stone hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
    >
      <Icon className="h-4 w-4" aria-hidden /> {children}
    </Link>
  );
}
