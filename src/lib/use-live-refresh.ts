"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keep server-rendered dashboard surfaces fresh without a manual reload.
 *
 * Fast path (new scans): every `pollMs` while the tab is visible, ask the
 * tiny /api/scans/latest endpoint for the owner's latest-scan fingerprint.
 * Only when it CHANGES do we router.refresh() — so a new scan appears within
 * ~pollMs, while the heavy analytics queries still run once per new scan,
 * not on every tick.
 *
 * Slow path (everything else — new/edited QRs, status changes): a full
 * refresh on tab focus/visibility and every `fullMs`.
 */
export function useLiveRefresh(pollMs = 2500, fullMs = 60000) {
  const router = useRouter();
  useEffect(() => {
    let last: string | null = null;
    let inFlight = false;
    let stopped = false;

    const refresh = () => router.refresh();

    const check = async () => {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const res = await fetch("/api/scans/latest", { cache: "no-store" });
        if (!res.ok) return; // signed out / transient — try again next tick
        const { v } = (await res.json()) as { v?: string };
        if (stopped || typeof v !== "string") return;
        if (last !== null && v !== last) refresh();
        last = v;
      } catch {
        /* network blip — next tick retries */
      } finally {
        inFlight = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
        void check();
      }
    };

    void check(); // seed the baseline
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    const fast = setInterval(check, pollMs);
    const slow = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, fullMs);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
      clearInterval(fast);
      clearInterval(slow);
    };
  }, [router, pollMs, fullMs]);
}
