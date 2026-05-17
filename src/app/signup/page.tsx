"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
    <main className="grid min-h-screen place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">It only takes a few seconds.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Full name" type="text" value={fullName} onChange={setFullName} required />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password (8+ chars)" type="password" value={password} onChange={setPassword} required />

          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-deep-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-deep-teal-dark disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-deep-teal hover:underline">
            Log in
          </Link>
        </p>
      </div>
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
        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-deep-teal focus:outline-none focus:ring-1 focus:ring-deep-teal"
      />
    </label>
  );
}
