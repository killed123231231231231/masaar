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
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-deep-teal">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Owner only
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Admin</h1>
            <p className="mt-1 text-sm text-charcoal/65">
              Updated {formatRiyadhDateTime(data.generatedAt)} (Riyadh time)
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm font-medium text-charcoal/80 transition-colors hover:bg-sand-light sm:self-auto"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Back to dashboard
          </Link>
        </header>

        {data.warnings.length > 0 && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-3 text-sm text-terracotta-dark"
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
            <DailyBarChart data={data.signupsDaily} seriesLabel="Sign-ups" color="#0F5B55" />
          </Card>
          <Card title="QR codes created per day" note="Last 30 days, Riyadh time">
            <DailyBarChart data={data.qrsDaily} seriesLabel="QR codes" color="#E07A5F" />
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
            <p className="mx-5 mb-3 rounded-lg bg-sand-light px-3 py-2 text-xs text-charcoal/70">
              The admin lock column is not in the database yet. Locking will only
              set the QR to suspended until that migration is applied.
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
    <div className="rounded-xl border border-charcoal/10 bg-white p-5 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-deep-teal/10 text-deep-teal">
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">{label}</p>
      </div>
      <p className="mt-4 font-display text-3xl font-bold leading-none">{value}</p>
      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-charcoal/10 pt-3">
        {details.map((d) => (
          <div key={d.label} className="min-w-0">
            <dt className="text-xs text-charcoal/60">{d.label}</dt>
            <dd className="font-display text-sm font-semibold text-deep-teal">{d.value}</dd>
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
    <section className="min-w-0 rounded-xl border border-charcoal/10 bg-white shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-3 pt-5">
        <h2 className="font-display text-base font-bold">{title}</h2>
        {note && <p className="text-xs text-charcoal/60">{note}</p>}
      </div>
      <div className={flush ? "pb-2" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}
