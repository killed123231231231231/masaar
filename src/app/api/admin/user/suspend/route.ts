import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { guardAdminPost } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

// Owner action: block a user from signing in. Uses a Supabase Auth ban
// (about 100 years), which is fully reversible with /unsuspend. The user's
// rows, including their QR codes, are not touched, so printed QRs keep
// scanning. Existing sessions end when their access token expires.
export async function POST(request: Request) {
  const guard = await guardAdminPost(request);
  if (guard instanceof NextResponse) return guard;
  const { admin, id } = guard;

  if (id === admin.id) {
    return NextResponse.json({ error: "You cannot suspend your own account." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: target, error: getError } = await supabase.auth.admin.getUserById(id);
  if (getError || !target?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (isAdminEmail(target.user.email)) {
    return NextResponse.json({ error: "Admin accounts cannot be suspended here." }, { status: 400 });
  }

  const { error } = await supabase.auth.admin.updateUserById(id, { ban_duration: "876000h" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
