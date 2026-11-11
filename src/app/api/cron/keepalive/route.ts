import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Supabase pauses Free-tier projects it judges "inactive" for 7+ days. A
// paused project would 404 every printed QR, so a Vercel Cron (vercel.json)
// calls this once a day to run one tiny real query against the database —
// guaranteed activity, zero cost, nothing written. If CRON_SECRET is set in
// Vercel, Vercel sends it as a Bearer token and we require it.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { error } = await createAdminClient()
    .from("qr_codes")
    .select("id", { count: "exact", head: true });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json(
    { ok: true, at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
