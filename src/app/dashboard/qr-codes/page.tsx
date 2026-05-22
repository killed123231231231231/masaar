import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QrCodesClient, { type QrCardData } from "./qr-codes-client";

export const dynamic = "force-dynamic";

// Account-wide grid of the user's QR codes. Lives at /dashboard/qr-codes —
// /dashboard itself is now the Overview page. The actual card UI lives in
// the client component so we can share the deep-teal sidebar shell.
export default async function QrCodesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [qrsRes, profileRes, qrCountRes] = await Promise.all([
    supabase
      .from("qr_codes")
      .select("id, name, kind, content_kind, destination, short_id, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("full_name, subscription_status")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("qr_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (qrsRes.error) throw qrsRes.error;
  const qrs = (qrsRes.data ?? []) as QrCardData[];

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

  const me = {
    email: user.email ?? "",
    name: profileRes.data?.full_name ?? user.email ?? "Account",
    plan: profileRes.data?.subscription_status === "active" ? "Pro" : "Free",
    qrCount: qrCountRes.count ?? 0,
  };

  return <QrCodesClient qrs={qrs} counts={counts} me={me} />;
}
