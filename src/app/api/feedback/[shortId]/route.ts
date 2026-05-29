import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Session D — anonymous feedback submission. Resolves the shortId to a
// feedback QR, hashes the IP, and inserts via the SECURITY DEFINER
// submit_feedback RPC (which enforces the per-IP-per-QR rate limit).
async function sha256_16(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;

  const body = await request.json().catch(() => null);
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
  }
  const comment =
    typeof body?.comment === "string" ? body.comment.slice(0, 2000) : null;
  const email = typeof body?.email === "string" ? body.email.slice(0, 200) : null;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const { data: qr } = await admin
    .from("qr_codes")
    .select("id")
    .eq("short_id", shortId)
    .eq("content_kind", "feedback")
    .maybeSingle();
  if (!qr) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = await sha256_16(ip);

  const { error } = await admin.rpc("submit_feedback", {
    p_qr_code_id: qr.id,
    p_rating: rating,
    p_comment: comment,
    p_email: email,
    p_ip_hash: ipHash,
  });

  if (error) {
    if (error.message?.includes("rate_limited")) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    return NextResponse.json({ error: "failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
