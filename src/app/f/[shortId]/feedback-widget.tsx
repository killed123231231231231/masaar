"use client";

import { useEffect, useState } from "react";
import { Star, Check } from "lucide-react";

export default function FeedbackWidget({
  shortId,
  headline,
  prompt,
  askEmail,
}: {
  shortId: string;
  headline: string;
  prompt: string;
  askEmail: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Device-level dedupe: one submission per device per QR (soft guard;
  // the server IP backstop is the real anti-spam).
  useEffect(() => {
    try {
      if (localStorage.getItem(`masaar.fb.${shortId}`)) setDone(true);
    } catch {
      /* ignore */
    }
  }, [shortId]);

  async function submit() {
    if (rating < 1) {
      setErr("Please pick a star rating.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/feedback/${shortId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          email: askEmail ? email.trim() || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(
          j.error === "rate_limited"
            ? "Thanks, looks like you’ve already shared feedback recently."
            : "Couldn’t submit just now. Please try again."
        );
        setSubmitting(false);
        return;
      }
      try {
        localStorage.setItem(`masaar.fb.${shortId}`, "1");
      } catch {
        /* ignore */
      }
      setDone(true);
    } catch {
      setErr("Couldn’t submit just now. Please try again.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime text-ink">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 font-heading text-[28px] font-medium tracking-[-0.02em] text-ink">
          Thanks for your feedback!
        </h1>
        <p className="mt-2 text-sm text-muted-3">We really appreciate it.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-center font-heading text-[28px] font-medium tracking-[-0.02em] text-ink">
        {headline}
      </h1>

      {/* Star selector — large tap targets. */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-10 w-10 ${filled ? "fill-amber-400 text-amber-400" : "text-muted-4"}`}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={prompt}
          className="block w-full min-h-[44px] rounded-xl border border-stone-dark bg-white px-4 py-3 hover:border-ink/25 text-sm text-ink outline-none transition-colors placeholder:text-muted-3 focus:border-ink focus:ring-2 focus:ring-ink/20"
        />
        {askEmail && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email (optional)"
            className="block w-full min-h-[44px] rounded-xl border border-stone-dark bg-white px-4 py-3 hover:border-ink/25 text-sm text-ink outline-none transition-colors placeholder:text-muted-3 focus:border-ink focus:ring-2 focus:ring-ink/20"
          />
        )}
      </div>

      {err && <p className="mt-3 text-center text-sm font-medium text-red-700">{err}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-ink px-4 py-3.5 text-[15px] font-medium text-white shadow-card transition-colors hover:bg-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Submit feedback"}
      </button>
    </div>
  );
}
