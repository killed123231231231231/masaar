import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import QrCodesClient, { type QrCardData } from "./qr-codes-client";

export const dynamic = "force-dynamic";

// Account-wide grid of the user's QR codes. Lives at /dashboard/qr-codes —
// /dashboard itself is now the Overview page. The actual card UI lives in
// the client component so we can share the dashboard sidebar shell.
export default async function QrCodesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?login=1&redirectTo=/dashboard/qr-codes");

  // QR list + me in parallel. scan_counts depends on the ids, runs after.
  const [qrsRes, me] = await Promise.all([
    supabase
      .from("qr_codes")
      .select("id, name, kind, content_kind, destination, short_id, status, created_at, fg_color, bg_color, gradient_color, dot_style, corner_style, logo_url, dot_palette, corner_colors, palette_options")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getMe(user.id, user.email ?? ""),
  ]);

  if (qrsRes.error) throw qrsRes.error;
  const qrs = (qrsRes.data ?? []) as QrCardData[];

  // Site-owner lock (migration 031). Read separately and tolerantly: before
  // the migration the column does not exist, the query errors, and no QR
  // is locked. Kept out of the main select so that query never breaks.
  if (qrs.length) {
    const { data: lockRows, error: lockErr } = await supabase
      .from("qr_codes")
      .select("id, admin_locked")
      .eq("user_id", user.id);
    if (!lockErr && lockRows) {
      const lockedIds = new Set(
        (lockRows as { id: string; admin_locked: boolean | null }[])
          .filter((r) => r.admin_locked === true)
          .map((r) => r.id)
      );
      for (const q of qrs) q.admin_locked = lockedIds.has(q.id);
    }
  }

  // Scan counts via Postgres aggregate — owner-RLS via RPC.
  const ids = qrs.map((q) => q.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const { data: countsRows, error: countsError } = await supabase.rpc(
      "scan_counts",
      { p_ids: ids }
    );
    if (countsError) throw countsError;
    for (const r of countsRows ?? []) counts[r.qr_code_id] = Number(r.count);
  }

  return <QrCodesClient qrs={qrs} counts={counts} me={me} />;
}
