import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Change account email. Re-verifies the current password via
// signInWithPassword before calling auth.updateUser({ email }) so a
// stolen-session can't quietly hijack the address. Supabase sends a
// confirmation email to the NEW address; the change isn't effective
// until the user clicks the link.
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
    new_email?: string;
    current_password?: string;
  } | null;
  const newEmail = (body?.new_email ?? "").trim().toLowerCase();
  const currentPassword = body?.current_password ?? "";

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!currentPassword) {
    return NextResponse.json({ error: "password_required" }, { status: 400 });
  }
  if (newEmail === user.email.toLowerCase()) {
    return NextResponse.json({ error: "same_email" }, { status: 400 });
  }

  // Re-verify current password (defense-in-depth — never trust the
  // browser session alone for irreversible account changes).
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
    email: newEmail,
  });
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
