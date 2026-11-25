"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import TurnstileWidget, { turnstileEnabled } from "@/components/turnstile-widget";

export default function SettingsClient({ email }: { email: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <EmailCard email={email} />
      <PasswordCard />
    </div>
  );
}

/* ─────────────────────────── EMAIL ─────────────────────────── */

function EmailCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // The server re-verifies the password via Supabase sign-in, which needs a
  // Turnstile token once bot protection is on.
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
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          new_email: newEmail,
          current_password: currentPassword,
          captcha_token: captcha,
        }),
      });
      setCaptchaReset((n) => n + 1);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const map: Record<string, string> = {
          invalid_email: "That email address doesn’t look valid.",
          invalid_current_password: "Current password is incorrect.",
          same_email: "That’s already your current email.",
          password_required: "Enter your current password to confirm.",
        };
        setErr(map[data?.error] || data?.message || data?.error || "Couldn’t update email.");
        setLoading(false);
        return;
      }
      toast.success(`Confirmation email sent to ${newEmail}. Click the link to finish.`);
      setOpen(false);
      setNewEmail("");
      setCurrentPassword("");
      setLoading(false);
    } catch {
      setErr("Network error. Please retry.");
      setLoading(false);
    }
  }

  return (
    <section className="min-w-0 rounded-card border border-stone-dark/70 bg-white p-6 font-body shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone text-ink">
          <Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[17px] font-semibold text-ink">Email</h2>
          <p className="mt-0.5 truncate text-sm text-muted-2">{email}</p>
        </div>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-stone px-5 text-sm font-medium text-ink transition-colors hover:bg-stone-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
        >
          Change email
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">
              New email
            </span>
            <input
              type="email"
              required
              autoFocus
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-stone-dark bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-muted-4 focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">
              Confirm current password
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
                className="w-full rounded-2xl border border-stone-dark bg-white px-4 py-2.5 pr-11 text-sm text-ink outline-none placeholder:text-muted-4 focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-2 grid place-items-center rounded-full px-2 text-muted-3 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <TurnstileWidget onToken={setCaptcha} resetKey={captchaReset} />
          {err && (
            <p role="alert" className="rounded-2xl border border-blush bg-blush/30 px-3.5 py-2.5 text-xs text-ink">
              {err}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Send confirmation"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setErr(null);
              }}
              className="inline-flex h-10 items-center rounded-full bg-stone px-5 text-sm font-medium text-ink transition-colors hover:bg-stone-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-muted-3">
            We send a confirmation link to your new email. The change takes
            effect after you click it.
          </p>
        </form>
      )}
    </section>
  );
}

/* ─────────────────────────── PASSWORD ─────────────────────────── */

function PasswordCard() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (turnstileEnabled && !captcha) {
      setErr("Please complete the verification below.");
      return;
    }
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
      setErr("New password needs at least 8 characters, with letters and numbers.");
      return;
    }
    if (next !== confirm) {
      setErr("New password and confirmation don’t match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          current_password: current,
          new_password: next,
          captcha_token: captcha,
        }),
      });
      setCaptchaReset((n) => n + 1);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const map: Record<string, string> = {
          invalid_current_password: "Current password is incorrect.",
          new_password_too_short: "New password needs at least 8 characters, with letters and numbers.",
          same_password: "Pick a new password different from the current one.",
          current_password_required: "Enter your current password.",
        };
        setErr(map[data?.error] || data?.message || data?.error || "Couldn’t update password.");
        setLoading(false);
        return;
      }
      toast.success("Password updated.");
      setOpen(false);
      setCurrent("");
      setNext("");
      setConfirm("");
      setLoading(false);
    } catch {
      setErr("Network error. Please retry.");
      setLoading(false);
    }
  }

  return (
    <section className="min-w-0 rounded-card border border-stone-dark/70 bg-white p-6 font-body shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone text-ink">
          <Lock className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-[17px] font-semibold text-ink">Password</h2>
          <p className="mt-0.5 text-sm text-muted-2">
            At least 8 characters, with letters and numbers. We check your current password before saving.
          </p>
        </div>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-stone px-5 text-sm font-medium text-ink transition-colors hover:bg-stone-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
        >
          Change password
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <Pw label="Current password" value={current} onChange={setCurrent} show={showPassword} setShow={setShowPassword} autoFocus />
          <Pw label="New password" value={next} onChange={setNext} show={showPassword} setShow={setShowPassword} />
          <Pw label="Confirm new password" value={confirm} onChange={setConfirm} show={showPassword} setShow={setShowPassword} />
          <TurnstileWidget onToken={setCaptcha} resetKey={captchaReset} />
          {err && (
            <p role="alert" className="rounded-2xl border border-blush bg-blush/30 px-3.5 py-2.5 text-xs text-ink">
              {err}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Update password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setErr(null);
              }}
              className="inline-flex h-10 items-center rounded-full bg-stone px-5 text-sm font-medium text-ink transition-colors hover:bg-stone-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Pw({
  label, value, onChange, show, setShow, autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: (b: boolean) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required
          autoFocus={autoFocus}
          minLength={label === "Current password" ? undefined : 8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-stone-dark bg-white px-4 py-2.5 pr-11 text-sm text-ink outline-none placeholder:text-muted-4 focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-2 grid place-items-center rounded-full px-2 text-muted-3 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
