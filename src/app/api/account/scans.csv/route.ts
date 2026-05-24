import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePeriod, periodBounds, periodDays } from "@/lib/analytics";

// B5/Fix 23 — account-wide CSV export of the user's scan history.
// Mirrors the per-QR /api/qr/[id]/scans.csv route: authed, owner-scoped
// via RLS (.in('qr_code_id', userQrIds)), 50k row cap, RFC-4180
// escaping. Node runtime.
export const runtime = "nodejs";

const MAX_ROWS = 50_000;

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const period = parsePeriod(
    new URL(request.url).searchParams.get("period") ?? undefined
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // User's QR ids — RLS scopes this to their own rows.
  const { data: qrs } = await supabase
    .from("qr_codes")
    .select("id, name, short_id")
    .eq("user_id", user.id);
  const ids = (qrs ?? []).map((q) => q.id as string);
  if (ids.length === 0) {
    // Empty account — return header-only CSV (still a valid download).
    const header =
      "scanned_at,qr_name,qr_short_id,destination,country,city,device_type,browser,os,ip_hash\r\n";
    return new Response(header, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="masaar-account-${period}-${new Date().toISOString().slice(0, 10)}.csv"`,
        "cache-control": "no-store",
      },
    });
  }

  const { startISO, endISO } = periodBounds(period);

  let q = supabase
    .from("scans")
    .select(
      "scanned_at, country, city, device_type, browser, os, ip_hash, " +
        "qr_codes(id, name, short_id, destination)",
      { count: "exact" }
    )
    .in("qr_code_id", ids)
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
    "scanned_at,qr_name,qr_short_id,destination,country,city,device_type,browser,os,ip_hash\r\n";
  // The embedded-select column list defeats Supabase's auto-typing so we
  // narrow at the row level here. (Same pattern getAccountActivity uses.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = ((rows ?? []) as any[])
    .map((r) => {
      const qr = (Array.isArray(r.qr_codes) ? r.qr_codes[0] : r.qr_codes) ?? null;
      return [
        r.scanned_at,
        qr?.name ?? "",
        qr?.short_id ?? "",
        qr?.destination ?? "",
        r.country,
        r.city,
        r.device_type,
        r.browser,
        r.os,
        r.ip_hash,
      ]
        .map(csvEscape)
        .join(",");
    })
    .join("\r\n");

  const today = new Date().toISOString().slice(0, 10);
  const filename = `masaar-account-${period}-${today}.csv`;

  return new Response(header + body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
