import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePeriod, periodBounds, periodDays } from "@/lib/analytics";

// CSV export of a QR's scans for the selected period. Authed +
// owner-RLS scoped. Caps at 50k rows (async exports = Sprint 3+).
// Node runtime — we build the body in memory.
export const runtime = "nodejs";

const MAX_ROWS = 50_000;

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const period = parsePeriod(new URL(request.url).searchParams.get("period") ?? undefined);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ownership via RLS — non-owners get no row.
  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, short_id, name")
    .eq("id", id)
    .maybeSingle();
  if (!qr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { startISO, endISO } = periodBounds(period);
  let q = supabase
    .from("scans")
    .select("scanned_at, country, city, device_type, browser, os, ip_hash", {
      count: "exact",
    })
    .eq("qr_code_id", id)
    .order("scanned_at", { ascending: false })
    .limit(MAX_ROWS + 1);
  if (periodDays(period) != null) {
    q = q.gte("scanned_at", startISO).lte("scanned_at", endISO);
  }
  const { data: rows, count, error } = await q;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  if ((count ?? rows?.length ?? 0) > MAX_ROWS) {
    return NextResponse.json(
      {
        error: `Export exceeds ${MAX_ROWS.toLocaleString()} rows. Narrow the period — async exports arrive in Sprint 3.`,
      },
      { status: 413 }
    );
  }

  const header =
    "scanned_at,country,city,device_type,browser,os,ip_hash\r\n";
  const body = (rows ?? [])
    .map((r) =>
      [r.scanned_at, r.country, r.city, r.device_type, r.browser, r.os, r.ip_hash]
        .map(csvEscape)
        .join(",")
    )
    .join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  const slug = qr.short_id || qr.id.slice(0, 8);
  const filename = `masaar-${slug}-${period}-${today}.csv`;

  return new Response(header + body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
