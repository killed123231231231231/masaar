"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * C2 — keep a server-rendered dashboard surface fresh without a manual
 * page reload. Calls router.refresh() (re-fetches the RSC payload) when:
 *   - the tab regains focus / becomes visible (e.g. you scanned on a phone
 *     then switched back to the dashboard), and
 *   - on a gentle interval while the tab is visible (so a scan shows up
 *     within ~intervalMs even while you're staring at the screen).
 * Cheap: only fires while visible; no client data layer needed.
 */
export function useLiveRefresh(intervalMs = 20000) {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => router.refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, intervalMs);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
      clearInterval(id);
    };
  }, [router, intervalMs]);
}
