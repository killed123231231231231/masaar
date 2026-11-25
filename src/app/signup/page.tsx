"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthAside from "@/components/auth-aside";
import TurnstileWidget, { turnstileEnabled } from "@/components/turnstile-widget";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (turnstileEnabled && !captcha) {
      setErr("Please complete the verification below.");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setErr("Password needs at least 8 characters, with letters and numbers.");
      return;
    }
    setLoading(true);
    setErr(null);
    setMsg(null);
    const supabase = createClient();
    // Email confirmation stays on: signUp returns no session until the
    // user clicks the link, so we never sign them straight in here.
    // captchaToken feeds Supabase Auth's native Turnstile check (enabled
    // in the Supabase dashboard together with the keys).
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        ...(captcha ? { captchaToken: captcha } : {}),
      },
    });
    setLoading(false);
    setCaptchaReset((n) => n + 1); // tokens are single-use
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("Check your inbox for a confirmation link.");
    // B7/P1-4 — no standalone /login page; land on the landing with the
    // Welcome Back modal pre-opened so they can sign in once confirmed.
    setTimeout(() => router.push("/?login=1"), 1500);
  }

  return (
    <main className="grid min-h-screen bg-paper font-body text-ink lg:grid-cols-[3fr_2fr]">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-panel bg-stone p-1.5">
        <div className="rounded-[26px] border border-stone-dark bg-white p-6 sm:p-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-stone px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-stone-dark"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" /> Back to home
          </Link>
          <h1 className="font-heading text-[32px] font-medium leading-tight tracking-[-0.02em] text-ink">Create your account</h1>
          <p className="mt-1.5 text-[15px] text-muted-2">Free plan, no card needed.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Full name" type="text" value={fullName} onChange={setFullName} required />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password (8+ characters, letters and numbers)" type="password" value={password} onChange={setPassword} required />

          <TurnstileWidget onToken={setCaptcha} resetKey={captchaReset} />

          {err && <p className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{err}</p>}
          {msg && <p className="rounded-xl bg-lime/50 p-2.5 text-sm text-ink">{msg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full bg-ink px-4 text-[15px] font-medium text-white shadow-card transition-colors duration-200 hover:bg-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

          <p className="mt-6 text-center text-sm text-muted-2">
            Already have an account?{" "}
            <Link href="/?login=1" className="font-semibold text-ink underline underline-offset-4 hover:no-underline">
              Log in
            </Link>
          </p>
        </div>
        </div>
      </div>
      <AuthAside />
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1.5 block h-11 w-full rounded-xl border border-stone-dark bg-white px-3.5 text-[15px] text-ink transition-colors duration-150 hover:border-ink/25 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
      />
    </label>
  );
}
