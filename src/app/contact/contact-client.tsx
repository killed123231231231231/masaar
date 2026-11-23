"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Flag, Mail, MessageSquare, Phone, User } from "lucide-react";
import { ABUSE_MESSAGE_MAX } from "@/lib/abuse-report";
import LogoMark from "@/components/logo-mark";
import TurnstileWidget, { turnstileEnabled } from "@/components/turnstile-widget";

// /contact — demo-request page, and the abuse-report form reached from
// the "Report abuse" link on hosted scan pages (mode="abuse", with the
// reported QR's shortId validated by page.tsx). Both POST to
// /api/contact, which calls submit_contact_request (migration 011,
// SECURITY DEFINER, 3/hr per IP) and fires a Resend notification.
export default function ContactClient({
  mode,
  reportedQr,
}: {
  mode: "demo" | "abuse";
  reportedQr: string | null;
}) {
  const isAbuse = mode === "abuse";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+966 ");
  const [message, setMessage] = useState("");
  const [preferred, setPreferred] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (turnstileEnabled && !captcha) {
      setErr("Please complete the verification below.");
      return;
    }
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
          phone: isAbuse || phone.trim() === "+966" ? "" : phone,
          message,
          preferred_time: isAbuse ? "" : preferred,
          turnstile_token: captcha,
          ...(isAbuse ? { topic: "abuse", qr: reportedQr ?? undefined } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setCaptchaReset((n) => n + 1); // tokens are single-use
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
    <main className="min-h-screen bg-paper font-body text-ink">
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1170px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="font-heading text-[22px] font-extrabold tracking-[-0.03em] text-ink sm:text-[26px]">
              Vertexa QR
            </span>
          </Link>
          <Link
            href="/create"
            className="group inline-flex h-10 items-center gap-2 rounded-full py-1.5 pl-1 pr-3 text-[15px] font-medium text-ink transition-colors hover:bg-stone focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white transition-transform group-hover:translate-x-0.5">
              <ChevronRight className="h-4 w-4" />
            </span>
            Create QR code
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
        {done ? (
          <ThankYou name={name} isAbuse={isAbuse} />
        ) : (
          <>
            {isAbuse ? (
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-stone px-3 py-1.5 text-sm font-medium text-ink">
                  <Flag className="h-3.5 w-3.5" /> Report abuse
                </span>
                <h1 className="mt-3 font-heading text-[36px] font-medium leading-[1.15] tracking-[-0.02em] sm:text-[54px]">
                  Report a QR code
                </h1>
                <p className="mt-3 text-base text-muted-2">
                  Tell us what this QR code opened and why it looks unsafe,
                  for example a fake login page or a scam. We review every
                  report and can switch the code off.
                </p>
              </div>
            ) : (
              <div className="text-left sm:text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-stone px-3 py-1.5 text-sm font-medium text-ink"><span aria-hidden className="h-2 w-2 rounded-full bg-lime ring-1 ring-ink/20" />
                  Book a demo
                </span>
                <h1 className="mt-3 font-heading text-[36px] font-medium leading-[1.15] tracking-[-0.02em] sm:text-[54px]">
                  Let’s talk about your QR rollout
                </h1>
                <p className="mt-3 text-balance text-base text-muted-2">
                  Tell us a bit about your business — we’ll get back within one
                  working day to set up a short walkthrough.
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-10 rounded-panel bg-stone p-1.5"
            >
              <div className="rounded-[26px] border border-stone-dark bg-white p-5 sm:p-8">
              {isAbuse && reportedQr && (
                <div className="mb-5 rounded-xl bg-stone px-4 py-3 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-2">
                    QR code being reported
                  </span>
                  <p className="mt-0.5 break-all font-mono text-ink">{reportedQr}</p>
                </div>
              )}
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
                {!isAbuse && (
                  <>
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
                  </>
                )}
              </div>

              <label className="mt-5 block">
                <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                  <MessageSquare className="h-3.5 w-3.5" />{" "}
                  {isAbuse ? "What is wrong with this QR code?" : "What do you want to discuss?"}
                </span>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={isAbuse ? ABUSE_MESSAGE_MAX : 5000}
                  placeholder={
                    isAbuse
                      ? "What did the QR code open, and where did you see it printed?"
                      : "A few sentences about your use case — restaurant menus, retail signage, event tickets, etc."
                  }
                  className="min-h-[132px] w-full rounded-xl border border-stone-dark bg-white px-3.5 py-2.5 text-ink placeholder:text-muted-3 hover:border-ink/25 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/20"
                />
              </label>

              <TurnstileWidget className="mt-5" onToken={setCaptcha} resetKey={captchaReset} />

              {err && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {err}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 h-11 w-full rounded-full bg-ink px-6 text-[15px] font-medium text-white shadow-card transition-colors hover:bg-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto"
              >
                {loading ? "Sending…" : isAbuse ? "Send report" : "Request demo"}
              </button>
              <p className="mt-3 text-xs text-muted-3">
                {isAbuse
                  ? "We only use your email to follow up on this report."
                  : "We reply to every request within one working day (Sun–Thu, Riyadh time)."}
              </p>
              </div>
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
      <span className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
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
        className="w-full rounded-xl h-11 border border-stone-dark bg-white px-3.5 py-2.5 text-ink placeholder:text-muted-3 hover:border-ink/25 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/20"
      />
    </label>
  );
}

function ThankYou({ name, isAbuse }: { name: string; isAbuse: boolean }) {
  const first = name.split(" ")[0] || "there";
  return (
    <div className="rounded-panel border border-stone-dark bg-white px-6 py-12 text-center shadow-card sm:p-12">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime text-ink">
        <Check className="h-7 w-7" strokeWidth={2.5} />
      </span>
      <h1 className="mt-5 font-heading text-[28px] font-medium tracking-[-0.02em] text-ink">
        {isAbuse ? `Thanks, ${first}. Your report was sent` : `Thanks, ${first} — we’ll be in touch`}
      </h1>
      <p className="mt-3 text-balance text-base text-muted-2">
        {isAbuse
          ? "We review every report and switch off codes that point to harmful content."
          : "Your request landed in our inbox. Expect a reply within one working day (Sun–Thu, Riyadh time)."}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-stone px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-stone-dark"
        >
          Back to home
        </Link>
        {!isAbuse && (
          <Link
            href="/create"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink-soft"
          >
            Create a QR while you wait
          </Link>
        )}
      </div>
    </div>
  );
}
