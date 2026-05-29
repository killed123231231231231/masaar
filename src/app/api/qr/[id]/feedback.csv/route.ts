import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Session D — owner-only CSV export of a feedback QR's responses. RLS
// (feedback_responses_owner_read) + the explicit owner check both gate it.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("content_kind", "feedback")
    .maybeSingle();
  if (!qr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data } = await supabase
    .from("feedback_responses")
    .select("rating, comment, email, submitted_at")
    .eq("qr_code_id", id)
    .order("submitted_at", { ascending: false });

  const rows = data ?? [];
  // Quote every field + double internal quotes; prefix risky leading chars
  // to neutralize CSV-injection in spreadsheet apps.
  const esc = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    "rating,comment,email,submitted_at",
    ...rows.map((r) =>
      [esc(r.rating), esc(r.comment), esc(r.email), esc(r.submitted_at)].join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="feedback-${id}.csv"`,
    },
  });
}
