"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import LogoMark from "@/components/logo-mark";
import { createClient } from "@/lib/supabase/client";

// Landing for password reset / first-time set links from
// supabase.auth.resetPasswordForEmail. Two stages:
//   1. "verifying" — exchange the PKCE `code` query param for a session
//   2. "set" — show the new-password form
// On submit we call updateUser({ password }) on the established session,
// then route to /dashboard. This also serves as the first-time password
// set for A.7 frictionless-checkout accounts (no password initially).
export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetClient />
    </Suspense>
  );
}

type Stage = "verifying" | "set" | "error";

function ResetClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [stage, setStage] = useState<Stage>("verifying");
  const [exchErr, setExchErr] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      setExchErr("Missing or invalid reset link. Please request a new one.");
      setStage("error");
      return;
    }
    const supabase = createClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          setExchErr(error.message || "This link has expired. Please request a new one.");
          setStage("error");
          return;
        }
        setStage("set");
      })
      .catch((e) => {
        setExchErr(e?.message || "Couldn’t verify the reset link.");
        setStage("error");
      });
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (password.length < 8) {
      setFormErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFormErr("Passwords don’t match.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSaving(false);
      setFormErr(error.message);
      return;
    }
    router.push("/dashboard?welcome=1");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-stretch justify-center px-5 py-10">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <LogoMark className="h-8 w-8" />
          <span className="font-heading text-[22px] font-extrabold tracking-[-0.03em] text-ink">
            Vertexa QR
          </span>
        </Link>

        <div className="rounded-panel border border-stone-dark bg-white p-7 shadow-float">
          {stage === "verifying" && (
            <div className="text-center">
              <h1 className="font-heading text-2xl font-medium text-ink">
                Verifying your link…
              </h1>
              <p className="mt-2 text-sm text-muted-2">One moment.</p>
            </div>
          )}

          {stage === "error" && (
            <div className="text-center">
              <h1 className="font-heading text-2xl font-medium text-ink">
                Couldn’t verify this link
              </h1>
              <p className="mt-2 text-sm text-muted-2">{exchErr}</p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
              >
                Back to home
              </Link>
            </div>
          )}

          {stage === "set" && (
            <>
              <h1 className="font-heading text-2xl font-medium text-ink">
                Set your password
              </h1>
              <p className="mt-1 text-sm text-muted-2">
                Pick something at least 8 characters long.
              </p>
              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoFocus
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    aria-label="New password"
                    className="w-full rounded-xl h-11 border border-stone-dark bg-white px-3.5 py-2.5 text-ink placeholder:text-muted-3 hover:border-ink/25 pr-10 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-2 grid place-items-center px-2 text-muted-3 hover:text-muted"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  aria-label="Confirm new password"
                  className="w-full rounded-xl h-11 border border-stone-dark bg-white px-3.5 py-2.5 text-ink placeholder:text-muted-3 hover:border-ink/25 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/20"
                />
                {formErr && (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                    {formErr}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Set password and continue"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
