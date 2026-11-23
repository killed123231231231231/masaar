import type { ReactNode } from "react";
import Sidebar, { type SidebarCurrent, type SidebarMe } from "@/components/dashboard/sidebar";
import MobileDashboardNav from "@/components/dashboard/mobile-dashboard-nav";

/**
 * Signed-in page chrome: ink sidebar (lg+), mobile top bar + drawer (<lg),
 * and a paper content column. Purely presentational — every page keeps its
 * own data fetching and auth checks.
 */
export default function DashboardFrame({
  me,
  current,
  upgradeHref,
  children,
  className = "space-y-7",
}: {
  me: SidebarMe;
  current: SidebarCurrent;
  upgradeHref?: string;
  children: ReactNode;
  /** Classes for the inner content column (spacing). */
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="flex">
        <Sidebar me={me} current={current} upgradeHref={upgradeHref} />
        <main className="min-w-0 flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          <MobileDashboardNav me={me} current={current} />
          <div className={`mx-auto w-full max-w-[1400px] ${className}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}
