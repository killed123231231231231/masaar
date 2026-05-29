"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Form = Record<string, any>;

const inputCls =
  "block w-full rounded-lg border border-charcoal/15 bg-sand-light/30 px-4 py-2.5 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/40 focus:border-deep-teal focus:bg-white focus:ring-2 focus:ring-deep-teal/15";

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
        <span className="mb-1.5 block text-sm font-semibold text-charcoal/80">Headline</span>
        <input
          value={form.headline ?? "How was your experience?"}
          onChange={(e) => set("headline", e.target.value)}
          maxLength={80}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-charcoal/80">Comment prompt</span>
        <input
          value={form.prompt ?? "Tell us more"}
          onChange={(e) => set("prompt", e.target.value)}
          maxLength={80}
          className={inputCls}
        />
      </label>

      <label className="flex items-center gap-2.5 rounded-lg border border-charcoal/10 bg-sand-light/30 px-4 py-3">
        <input
          type="checkbox"
          checked={askEmail}
          onChange={(e) => set("ask_email", e.target.checked)}
          className="h-4 w-4 accent-deep-teal"
        />
        <span className="text-sm text-charcoal/75">
          Ask for the customer’s email (optional for them)
        </span>
      </label>

      <p className="rounded-lg bg-sand-light/50 px-4 py-3 text-xs leading-relaxed text-charcoal/55">
        Customers scan, pick a 1–5 star rating, and can add a comment
        {askEmail ? " and their email" : ""}. Responses land in your dashboard
        under <strong>Feedback</strong>.
      </p>
    </div>
  );
}
