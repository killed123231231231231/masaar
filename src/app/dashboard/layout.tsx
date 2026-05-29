import type { ReactNode } from "react";
import LiveRefresh from "@/components/dashboard/live-refresh";

// C2 — passthrough layout for all /dashboard surfaces. Adds one mounted
// LiveRefresh helper so new QRs/scans appear without a manual reload.
// (No visual wrapper — each page keeps rendering its own Sidebar + shell.)
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <LiveRefresh />
    </>
  );
}
