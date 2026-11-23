import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardAdminPost } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

// Owner action: lift a Supabase Auth ban set by /suspend.
export async function POST(request: Request) {
  const guard = await guardAdminPost(request);
  if (guard instanceof NextResponse) return guard;
  const { id } = guard;

  const supabase = createAdminClient();
  const { data: target, error: getError } = await supabase.auth.admin.getUserById(id);
  if (getError || !target?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await supabase.auth.admin.updateUserById(id, { ban_duration: "none" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
