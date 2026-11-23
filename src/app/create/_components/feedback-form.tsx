"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Form = Record<string, any>;

const inputCls =
  "block min-h-[44px] w-full rounded-xl border border-stone-dark bg-white px-4 py-2.5 font-body text-[15px] text-ink outline-none transition-colors placeholder:text-muted-3 hover:border-ink/25 focus:border-ink focus:ring-2 focus:ring-ink/20";

export default function FeedbackForm({
  form,
  setForm,
}: {
  form: Form;
  setForm: (f: Form) => void;
}) {
  const set = (k: string, v: unknown) => setForm({ ...form, [k]: v });
  const askEmail = !!form.ask_email;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block font-body text-sm font-medium text-ink">Headline</span>
        <input
          value={form.headline ?? "How was your experience?"}
          onChange={(e) => set("headline", e.target.value)}
          maxLength={80}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block font-body text-sm font-medium text-ink">Comment prompt</span>
        <input
          value={form.prompt ?? "Tell us more"}
          onChange={(e) => set("prompt", e.target.value)}
          maxLength={80}
          className={inputCls}
        />
      </label>

      <label className="flex items-center gap-2.5 rounded-xl border border-ink/10 bg-stone/60 px-4 py-3">
        <input
          type="checkbox"
          checked={askEmail}
          onChange={(e) => set("ask_email", e.target.checked)}
          className="h-4 w-4 accent-ink"
        />
        <span className="text-sm text-muted">
          Ask for the customer’s email (optional for them)
        </span>
      </label>

      <p className="rounded-xl bg-stone/60 px-4 py-3 text-xs leading-relaxed text-muted-2">
        Customers scan, pick a 1–5 star rating, and can add a comment
        {askEmail ? " and their email" : ""}. Responses land in your dashboard
        under <strong>Feedback</strong>.
      </p>
    </div>
  );
}
