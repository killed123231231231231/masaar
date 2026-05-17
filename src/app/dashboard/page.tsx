import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard-shell";
import { BarChart3, Pencil, QrCode, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: qrs } = await supabase
    .from("qr_codes")
    .select("*")
    .order("created_at", { ascending: false });

  // Scan counts per QR — single aggregated query
  const ids = (qrs ?? []).map((q) => q.id);
  let counts: Record<string, number> = {};
  if (ids.length) {
    const { data: scans } = await supabase
      .from("scans")
      .select("qr_code_id")
      .in("qr_code_id", ids);
    counts = (scans ?? []).reduce<Record<string, number>>((acc, s) => {
      acc[s.qr_code_id] = (acc[s.qr_code_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your QR codes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {qrs?.length ?? 0} {qrs?.length === 1 ? "code" : "codes"} total
          </p>
        </div>
        <Link
          href="/dashboard/qr/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New QR Code
        </Link>
      </div>

      {!qrs?.length ? (
        <EmptyState />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qrs.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-brand-50 grid place-items-center text-brand-600">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{q.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{q.kind} · {q.content_kind}</p>
                  </div>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {counts[q.id] ?? 0} scans
                </span>
              </div>
              <p className="mt-3 truncate text-xs text-gray-500">{q.destination}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/dashboard/qr/${q.id}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <Link
                  href={`/dashboard/qr/${q.id}/analytics`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Analytics
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-brand-50 grid place-items-center text-brand-600">
        <QrCode className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No QR codes yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Create your first dynamic QR code and start tracking scans.
      </p>
      <Link
        href="/dashboard/qr/new"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" /> Create QR Code
      </Link>
    </div>
  );
}
