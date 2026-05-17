"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthAside from "@/components/auth-aside";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[3fr_2fr]">
      <div className="flex items-center justify-center bg-sand-light/40 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-charcoal/10">
          <h1 className="font-display text-2xl font-bold text-charcoal">Welcome back</h1>
          <p className="mt-1 text-sm text-charcoal/55">Log in to manage your QR codes.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-deep-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-deep-teal-dark transition-colors duration-200 disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

          <p className="mt-6 text-center text-sm text-charcoal/55">
            New to Masaar?{" "}
            <Link href="/signup" className="font-semibold text-deep-teal hover:underline">
              Create an account
            </Link>
          </p>
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
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 block w-full rounded-lg border border-gray-200 h-11 px-3 text-sm shadow-sm transition-colors duration-150 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/30"
      />
    </label>
  );
}
