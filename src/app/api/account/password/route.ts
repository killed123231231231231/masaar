import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Change account password. Re-verifies the current password via
// signInWithPassword before calling auth.updateUser({ password }).
export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    current_password?: string;
    new_password?: string;
  } | null;
  const currentPassword = body?.current_password ?? "";
  const newPassword = body?.new_password ?? "";

  if (!currentPassword) {
    return NextResponse.json({ error: "current_password_required" }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "new_password_too_short" }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "same_password" }, { status: 400 });
  }

  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr) {
    return NextResponse.json(
      { error: "invalid_current_password" },
      { status: 401 }
    );
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
