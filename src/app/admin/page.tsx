import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle, ArrowLeft, QrCode, ScanLine, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { formatRiyadhDateTime, requireAdmin } from "@/lib/admin";
import { loadAdminData } from "./data";
import { DailyBarChart, QrTypeList } from "./charts";
import { RecentQrTable, UsersTable } from "./tables";

// Owner-only panel. Non-admins (including signed-out visitors) get a plain
// 404 so the route does not reveal that it exists.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

const fmt = (n: number | null) => (n === null ? "-" : n.toLocaleString("en-US"));

export default async function AdminPage() {
  const user = await requireAdmin();
  if (!user) notFound();

  const data = await loadAdminData(user.id);
  const { kpis } = data;

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-lime px-2.5 py-1 text-xs font-medium text-ink">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Owner only
            </p>
            <h1 className="mt-3 font-heading text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">Admin</h1>
            <p className="mt-1 text-sm text-muted-2">
              Updated {formatRiyadhDateTime(data.generatedAt)} (Riyadh time)
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-1.5 self-start rounded-full bg-stone px-4 text-sm font-medium text-ink transition-colors hover:bg-stone-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Back to dashboard
          </Link>
        </header>

        {data.warnings.length > 0 && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-card border border-blush bg-blush/30 px-4 py-3 text-sm text-ink"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <p>{data.warnings.join(" ")}</p>
          </div>
        )}

        <section aria-label="Totals" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            icon={Users}
            label="Users"
            value={fmt(kpis.totalUsers)}
            details={[
              { label: "Last 7 days", value: `+${fmt(kpis.newUsers7)}` },
              { label: "Last 30 days", value: `+${fmt(kpis.newUsers30)}` },
            ]}
          />
          <StatCard
            icon={QrCode}
            label="QR codes"
            value={fmt(kpis.totalQrs)}
            details={[
              { label: "Last 7 days", value: `+${fmt(kpis.newQrs7)}` },
              { label: "Dynamic", value: fmt(data.qrKinds.dynamic) },
            ]}
          />
          <StatCard
            icon={ScanLine}
            label="Scans"
            value={fmt(kpis.totalScans)}
            details={[
              {
                label: "Last 7 days",
                value: kpis.scans7 === null ? "-" : `+${fmt(kpis.scans7)}`,
              },
            ]}
          />
        </section>

        <section aria-label="Daily activity" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="New sign-ups per day" note="Last 30 days, Riyadh time">
            <DailyBarChart data={data.signupsDaily} seriesLabel="Sign-ups" color="#1A1A1A" />
          </Card>
          <Card title="QR codes created per day" note="Last 30 days, Riyadh time">
            <DailyBarChart data={data.qrsDaily} seriesLabel="QR codes" color="#B9E23A" />
          </Card>
        </section>

        <Card title="QR codes by type" note={`${fmt(kpis.totalQrs)} in total`}>
          <QrTypeList types={data.qrTypes} kinds={data.qrKinds} />
        </Card>

        <Card
          title="Users"
          note={
            kpis.totalUsers > data.usersTotalShown
              ? `Newest ${data.usersTotalShown} of ${fmt(kpis.totalUsers)}`
              : `${fmt(data.usersTotalShown)} in total`
          }
          flush
        >
          <UsersTable users={data.users} />
        </Card>

        <Card title="Recent QR codes" note="Newest 50" flush>
          {data.lockColumnMissing && (
            <p className="mx-5 mb-3 rounded-2xl bg-cream px-3 py-2 text-xs text-muted-2">
              Locking is off until database migration 031 (admin lock) is
              applied.
            </p>
          )}
          <RecentQrTable qrs={data.recentQrs} lockColumnMissing={data.lockColumnMissing} />
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  details,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  details: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-card border border-stone-dark/70 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink">
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="text-[13px] text-muted-2">{label}</p>
      </div>
      <p className="mt-4 font-heading text-3xl font-semibold leading-none tracking-[-0.02em]">{value}</p>
      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-stone pt-3">
        {details.map((d) => (
          <div key={d.label} className="min-w-0">
            <dt className="text-xs text-muted-3">{d.label}</dt>
            <dd className="font-heading text-sm font-semibold text-ink">{d.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Card({
  title,
  note,
  flush,
  children,
}: {
  title: string;
  note?: string;
  /** Edge-to-edge body (for tables). */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-card border border-stone-dark/70 bg-white shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-3 pt-5">
        <h2 className="font-heading text-[17px] font-semibold">{title}</h2>
        {note && <p className="text-xs text-muted-3">{note}</p>}
      </div>
      <div className={flush ? "pb-2" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}
