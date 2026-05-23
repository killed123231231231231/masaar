"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Mail, MessageSquare, Phone, User } from "lucide-react";
import LogoMark from "@/components/logo-mark";

// /contact — real demo-request page that replaces the old
// mailto:hello@masaar.sa link from Session B's landing. Server form
// POSTs to /api/contact, which calls submit_contact_request (migration
// 011, SECURITY DEFINER, 3/hr per IP) and fires a Resend notification.
export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+966 ");
  const [message, setMessage] = useState("");
  const [preferred, setPreferred] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          // Strip the default "+966 " if the user didn't add a real number.
          phone: phone.trim() === "+966" ? "" : phone,
          message,
          preferred_time: preferred,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErr(data?.message || data?.error || "Couldn’t submit your request.");
        setLoading(false);
        return;
      }
      setDone(true);
      setLoading(false);
    } catch {
      setErr("Network error — please retry.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <header className="border-b border-charcoal/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight">
              Masaar <span className="font-arabic text-deep-teal">مسار</span>
            </span>
          </Link>
          <Link
            href="/create"
            className="rounded-lg bg-deep-teal px-4 py-2 text-sm font-semibold text-white hover:bg-deep-teal-dark"
          >
            Create QR Code
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-12 lg:py-16">
        {done ? (
          <ThankYou name={name} />
        ) : (
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-deep-teal">
                Book a demo
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Let’s talk about your QR rollout
              </h1>
              <p className="mt-3 text-balance text-base text-charcoal/65">
                Tell us a bit about your business — we’ll get back within one
                working day to set up a short walkthrough.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-10 rounded-2xl border border-charcoal/10 bg-white p-7 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)] sm:p-9"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  icon={User}
                  label="Name"
                  required
                  value={name}
                  onChange={setName}
                  placeholder="Ahmed Al-Saud"
                  autoComplete="name"
                />
                <Field
                  icon={Mail}
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={setEmail}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
                <Field
                  icon={Phone}
                  label="Phone (optional)"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+966 5X XXX XXXX"
                  autoComplete="tel"
                />
                <Field
                  label="Preferred demo time (optional)"
                  value={preferred}
                  onChange={setPreferred}
                  placeholder="e.g. Tuesday 2pm Riyadh time"
                />
              </div>

              <label className="mt-5 block">
                <span className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal/55">
                  <MessageSquare className="h-3.5 w-3.5" /> What do you want to discuss?
                </span>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  placeholder="A few sentences about your use case — restaurant menus, retail signage, event tickets, etc."
                  className="w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
                />
              </label>

              {err && (
                <p className="mt-4 rounded-md border border-terracotta/25 bg-terracotta/5 p-3 text-sm text-terracotta-dark">
                  {err}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-lg bg-deep-teal px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-deep-teal-dark disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Sending…" : "Request demo"}
              </button>
              <p className="mt-3 text-xs text-charcoal/45">
                We reply to every request within one working day (Sun–Thu, Riyadh time).
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
  autoComplete,
  icon: Icon,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal/55">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
      />
    </label>
  );
}

function ThankYou({ name }: { name: string }) {
  const first = name.split(" ")[0] || "there";
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-12 text-center shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-deep-teal/10 text-deep-teal">
        <Check className="h-7 w-7" strokeWidth={2.5} />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold text-charcoal">
        Thanks, {first} — we’ll be in touch
      </h1>
      <p className="mt-3 text-balance text-base text-charcoal/65">
        Your request landed in our inbox. Expect a reply within one working day
        (Sun–Thu, Riyadh time).
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-charcoal/15 bg-white px-5 py-2.5 text-sm font-semibold text-charcoal/75 hover:bg-sand-light"
        >
          Back to home
        </Link>
        <Link
          href="/create"
          className="rounded-lg bg-deep-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-deep-teal-dark"
        >
          Create a QR while you wait
        </Link>
      </div>
    </div>
  );
}
