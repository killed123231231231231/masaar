"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Unlock, UserCheck, UserX, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

export type AdminAction = "qr-lock" | "qr-unlock" | "user-suspend" | "user-unsuspend";

const ACTIONS: Record<AdminAction, { path: string; label: string; icon: LucideIcon; danger: boolean; done: string }> = {
  "qr-lock": { path: "/api/admin/qr/lock", label: "Lock", icon: Lock, danger: true, done: "QR code locked" },
  "qr-unlock": { path: "/api/admin/qr/unlock", label: "Unlock", icon: Unlock, danger: false, done: "QR code unlocked" },
  "user-suspend": { path: "/api/admin/user/suspend", label: "Suspend", icon: UserX, danger: true, done: "User suspended" },
  "user-unsuspend": { path: "/api/admin/user/unsuspend", label: "Unsuspend", icon: UserCheck, danger: false, done: "User unsuspended" },
};

// One owner action. Nothing runs until the owner clicks and confirms; the
// page then re-renders from the server so the tables show the new state.
export default function AdminActionButton({
  action,
  id,
  confirmText,
}: {
  action: AdminAction;
  id: string;
  confirmText: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const cfg = ACTIONS[action];
  const Icon = busy || refreshing ? Loader2 : cfg.icon;

  async function run() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch(cfg.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !body?.ok) {
        toast.error(body?.error ?? "That did not work. Try again.");
        return;
      }
      toast.success(cfg.done);
      startTransition(() => router.refresh());
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy || refreshing}
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
        cfg.danger
          ? "bg-ink text-white hover:bg-ink-soft"
          : "bg-stone text-ink hover:bg-stone-dark"
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${busy || refreshing ? "animate-spin" : ""}`} strokeWidth={2} aria-hidden />
      {cfg.label}
    </button>
  );
}
