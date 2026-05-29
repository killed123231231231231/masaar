import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Session D — Payment-placeholder waitlist capture. waitlist_signups has
// no client-write policy, so the insert goes through the service role.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const source = typeof body?.source === "string" ? body.source.slice(0, 50) : "payment_qr";

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const { error } = await admin.from("waitlist_signups").insert({ email, source });
  if (error) return NextResponse.json({ error: "failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
