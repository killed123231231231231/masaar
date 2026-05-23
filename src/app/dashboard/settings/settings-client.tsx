"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ new_email: newEmail, current_password: currentPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const map: Record<string, string> = {
          invalid_email: "That email address doesn’t look valid.",
          invalid_current_password: "Current password is incorrect.",
          same_email: "That’s already your current email.",
          password_required: "Enter your current password to confirm.",
        };
        setErr(map[data?.error] || data?.error || "Couldn’t update email.");
        setLoading(false);
        return;
      }
      toast.success(`Confirmation email sent to ${newEmail}. Click the link to finish.`);
      setOpen(false);
      setNewEmail("");
      setCurrentPassword("");
      setLoading(false);
    } catch {
      setErr("Network error — please retry.");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-deep-teal/10 text-deep-teal">
          <Mail className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold text-charcoal">Email</h2>
          <p className="mt-0.5 truncate text-sm text-charcoal/65">{email}</p>
        </div>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 inline-flex items-center justify-center rounded-lg border border-charcoal/15 bg-white px-4 py-2 text-sm font-semibold text-charcoal/75 hover:bg-sand-light"
        >
          Change email
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal/55">
              New email
            </span>
            <input
              type="email"
              required
              autoFocus
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal/55">
              Confirm current password
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Your current password"
                className="w-full rounded-lg border border-charcoal/15 px-3 py-2.5 pr-10 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-2 grid place-items-center px-2 text-charcoal/50 hover:text-charcoal/75"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          {err && (
            <p className="rounded-md border border-terracotta/25 bg-terracotta/5 p-2.5 text-xs text-terracotta-dark">
              {err}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-deep-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-deep-teal-dark disabled:opacity-60"
            >
              {loading ? "Saving…" : "Send confirmation"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setErr(null);
              }}
              className="rounded-lg border border-charcoal/15 bg-white px-5 py-2.5 text-sm font-semibold text-charcoal/75 hover:bg-sand-light"
            >
              Cancel
            </button>
          </div>
          <p className="text-[11px] text-charcoal/45">
            Supabase will send a confirmation link to your new email. The
            change isn’t effective until you click that link.
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (next.length < 8) {
      setErr("New password must be at least 8 characters.");
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
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const map: Record<string, string> = {
          invalid_current_password: "Current password is incorrect.",
          new_password_too_short: "New password must be at least 8 characters.",
          same_password: "Pick a new password different from the current one.",
          current_password_required: "Enter your current password.",
        };
        setErr(map[data?.error] || data?.error || "Couldn’t update password.");
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
      setErr("Network error — please retry.");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-deep-teal/10 text-deep-teal">
          <Lock className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold text-charcoal">Password</h2>
          <p className="mt-0.5 text-sm text-charcoal/65">
            At least 8 characters. We re-verify the current one before saving.
          </p>
        </div>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 inline-flex items-center justify-center rounded-lg border border-charcoal/15 bg-white px-4 py-2 text-sm font-semibold text-charcoal/75 hover:bg-sand-light"
        >
          Change password
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <Pw label="Current password" value={current} onChange={setCurrent} show={showPassword} setShow={setShowPassword} autoFocus />
          <Pw label="New password" value={next} onChange={setNext} show={showPassword} setShow={setShowPassword} />
          <Pw label="Confirm new password" value={confirm} onChange={setConfirm} show={showPassword} setShow={setShowPassword} />
          {err && (
            <p className="rounded-md border border-terracotta/25 bg-terracotta/5 p-2.5 text-xs text-terracotta-dark">
              {err}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-deep-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-deep-teal-dark disabled:opacity-60"
            >
              {loading ? "Saving…" : "Update password"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setErr(null);
              }}
              className="rounded-lg border border-charcoal/15 bg-white px-5 py-2.5 text-sm font-semibold text-charcoal/75 hover:bg-sand-light"
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
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-charcoal/55">
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
          className="w-full rounded-lg border border-charcoal/15 px-3 py-2.5 pr-10 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-2 grid place-items-center px-2 text-charcoal/50 hover:text-charcoal/75"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
