import {
  Activity, LayoutGrid, QrCode, Settings,
  type LucideIcon,
} from "lucide-react";

// Shared (server + client safe) nav + plan helpers for the dashboard chrome.
// Kept out of the "use client" sidebar module so server pages can call them.

export type SidebarCurrent =
  | "overview"
  | "qrcodes"
  | "activity"
  | "settings"
  | "none";

export interface SidebarMe {
  email: string;
  name: string;
  plan: string;     // "Pro" | "Free"
  qrCount: number;
}

// Free plan = 25 QR codes (mirrors DEFAULT_QR_QUOTA / migration 031).
export const PLAN_LIMITS: Record<string, number> = { Free: 25, Pro: 5000 };

export type NavSpec = { label: string; icon: LucideIcon; href: string; key: SidebarCurrent };

// B5/Fix 20 — four real destinations only.
export const NAV: NavSpec[] = [
  { label: "Overview", icon: LayoutGrid, href: "/dashboard", key: "overview" },
  { label: "QR Codes", icon: QrCode, href: "/dashboard/qr-codes", key: "qrcodes" },
  { label: "Activity", icon: Activity, href: "/dashboard/activity", key: "activity" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings", key: "settings" },
];

/**
 * Plan usage for the sidebar meter. `used` is the real QR count (never
 * capped); only the bar width `pct` is clamped to 0-100. `limit` is the
 * plan's default cap, not the per-user profiles.qr_quota (not on MeBundle),
 * so it must not be stated as a hard fact on prominent surfaces.
 */
export function planUsage(me: SidebarMe) {
  const limit = PLAN_LIMITS[me.plan] ?? 25;
  const used = Math.max(0, me.qrCount);
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return { limit, used, pct };
}

/** Up to two initials from the display name (falls back to the email). */
export function initials(me: SidebarMe): string {
  const src = (me.name && me.name !== me.email ? me.name : "").trim();
  if (src) {
    const parts = src.split(/\s+/).filter(Boolean);
    const two = (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
    if (two) return two.toUpperCase();
  }
  return (me.email?.[0] || "U").toUpperCase();
}
