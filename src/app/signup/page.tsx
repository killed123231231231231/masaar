"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AuthAside from "@/components/auth-aside";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("Check your inbox for a confirmation link.");
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[3fr_2fr]">
      <div className="flex items-center justify-center bg-sand-light/40 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-charcoal/10">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal/55 transition-colors hover:text-deep-teal"
          >
            <span aria-hidden>←</span> Back to home
          </Link>
          <h1 className="font-display text-2xl font-bold text-charcoal">Create your account</h1>
          <p className="mt-1 text-sm text-charcoal/55">It only takes a few seconds.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Full name" type="text" value={fullName} onChange={setFullName} required />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password (8+ chars)" type="password" value={password} onChange={setPassword} required />

          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-deep-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-deep-teal-dark transition-colors duration-200 disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

          <p className="mt-6 text-center text-sm text-charcoal/55">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-deep-teal hover:underline">
              Log in
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
