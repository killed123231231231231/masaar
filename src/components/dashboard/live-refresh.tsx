"use client";

import { useLiveRefresh } from "@/lib/use-live-refresh";

/**
 * C2 — invisible helper mounted once in the dashboard layout. Keeps every
 * dashboard surface fresh (new QRs + new scans) on tab-focus and a gentle
 * interval, so the user never has to manually reload to show a client a
 * just-created QR or an incoming scan.
 */
export default function LiveRefresh() {
  useLiveRefresh();
  return null;
}
