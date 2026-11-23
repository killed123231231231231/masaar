import type { ReactNode } from "react";
import {
  BarChart3,
  LayoutGrid,
  Plus,
  QrCode,
  Settings,
  type LucideIcon,
} from "lucide-react";
import LogoMark from "@/components/logo-mark";
import { Cloud } from "@/components/site/shapes";

export type Tint = "lilac" | "sky" | "mint" | "blush";

const TINT_BG: Record<Tint, string> = {
  lilac: "bg-lilac",
  sky: "bg-sky",
  mint: "bg-mint",
  blush: "bg-blush",
};

/**
 * Pastel product frame: a rounded-32 tinted panel with film grain and soft
 * cloud shapes. Children (usually an AppWindow) sit on top.
 */
export function PastelFrame({
  tint,
  children,
  className = "",
}: {
  tint: Tint;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grain relative overflow-hidden rounded-panel transition-colors duration-500 ${TINT_BG[tint]} ${className}`}
    >
      <Cloud className="-left-[10%] top-[8%] h-[46%] w-[60%]" opacity={0.75} />
      <Cloud className="-right-[12%] bottom-[-6%] h-[52%] w-[64%]" opacity={0.6} />
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  );
}

const SIDEBAR: { icon: LucideIcon; key: string }[] = [
  { icon: LayoutGrid, key: "overview" },
  { icon: QrCode, key: "codes" },
  { icon: Plus, key: "create" },
  { icon: BarChart3, key: "analytics" },
  { icon: Settings, key: "settings" },
];

/**
 * Realistic Vertexa QR app window, built in HTML (decorative — the
 * surrounding section describes it for screen readers). Inter 12–14px.
 */
export function AppWindow({
  children,
  active = "create",
  path = "quickqrcode.live/create",
  className = "",
  sidebar = true,
}: {
  children: ReactNode;
  active?: string;
  path?: string;
  className?: string;
  sidebar?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`flex flex-col overflow-hidden rounded-[18px] border border-ink/[0.07] bg-white font-sans text-ink shadow-float ${className}`}
    >
      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-ink/[0.06] bg-cream px-3.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-dark" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-dark" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-dark" />
        </div>
        <div className="mx-auto flex h-6 min-w-0 max-w-[260px] flex-1 items-center justify-center rounded-md bg-white px-3 text-[11px] text-muted-3 ring-1 ring-ink/[0.05]">
          {/* The span truncates; truncating the centring flex box itself
              clipped both ends on phones ("uickqrcode.live/dashboard/c"). */}
          <span className="min-w-0 truncate">{path}</span>
        </div>
        <div className="hidden w-[42px] sm:block" />
      </div>
      <div className="flex min-h-0 flex-1">
        {sidebar && (
          <div className="hidden w-[52px] shrink-0 flex-col items-center gap-2 border-r border-ink/[0.06] bg-cream/60 py-3 sm:flex">
            <LogoMark className="mb-2 h-6 w-6" />
            {SIDEBAR.map(({ icon: Icon, key }) => (
              <span
                key={key}
                className={`grid h-8 w-8 place-items-center rounded-lg ${
                  key === active ? "bg-lime text-ink" : "text-muted-3"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
            ))}
          </div>
        )}
        <div className="min-w-0 flex-1 overflow-hidden p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

/** Read-only form field lookalike (not a real input). */
export function FieldMock({
  label,
  value,
  icon: Icon,
  focused = false,
  mono = false,
  hint,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  focused?: boolean;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium text-muted-2">{label}</div>
      <div
        className={`flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-[13px] ${
          focused ? "border-ink/70 shadow-[0_0_0_3px_rgba(219,252,116,0.7)]" : "border-ink/10"
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-3" />}
        <span className={`truncate ${mono ? "tracking-[0.2em]" : ""}`}>{value}</span>
        {focused && <span className="-ml-1.5 h-4 w-px animate-pulse bg-ink" />}
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-3">{hint}</div>}
    </div>
  );
}

/** Small on/off switch lookalike. */
export function SwitchMock({ on = true }: { on?: boolean }) {
  return (
    <span
      className={`relative inline-block h-[18px] w-8 shrink-0 rounded-full ${on ? "bg-ink" : "bg-stone-dark"}`}
    >
      <span
        className={`absolute top-[2px] h-[14px] w-[14px] rounded-full ${on ? "left-[16px] bg-lime" : "left-[2px] bg-white"}`}
      />
    </span>
  );
}

/** Tiny chip used inside mock UIs. */
export function ChipMock({
  children,
  tone = "stone",
}: {
  children: ReactNode;
  tone?: "stone" | "lime" | "ink" | "white";
}) {
  const cls = {
    stone: "bg-stone text-ink",
    lime: "bg-lime text-ink",
    ink: "bg-ink text-white",
    white: "bg-white text-ink ring-1 ring-ink/[0.08]",
  }[tone];
  return (
    <span className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}
