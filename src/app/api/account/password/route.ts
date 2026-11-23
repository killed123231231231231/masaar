import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";

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
  if (!(await rateLimit("account_password_user", user.id, 5, 3600)).ok) {
    return rateLimitedResponse();
  }

  const body = (await request.json().catch(() => null)) as {
    current_password?: string;
    new_password?: string;
    captcha_token?: string | null;
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
    // Supabase Auth's Turnstile check also applies to this re-verification
    // once bot protection is enabled; the settings form forwards a token.
    ...(typeof body?.captcha_token === "string" && body.captcha_token
      ? { options: { captchaToken: body.captcha_token } }
      : {}),
  });
  if (verifyErr?.message?.toLowerCase().includes("captcha")) {
    return NextResponse.json(
      { error: "captcha_failed", message: "Please complete the verification and try again." },
      { status: 400 }
    );
  }
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
