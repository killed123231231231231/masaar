"use client";

import { typeMeta, type WizardType } from "../_lib/types";

// Minimal for the keystone: the rich accordion (Frame / Customization /
// Logo / Protect) is built in the post-pause commits. The QR is created
// with brand-neutral defaults via the existing funnel when the user
// clicks "Download QR" in the footer.
export default function Step3Customize({
  type,
  name,
}: {
  type: WizardType;
  name: string;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold tracking-tight text-charcoal">
        Customize &amp; protect
      </h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Frame, colors, logo and password options arrive in the next
        commits of this session.
      </p>

      <div className="mt-6 space-y-3">
        {["Frame around the QR code", "Customization", "Logo", "Protect with a password"].map(
          (s) => (
            <div
              key={s}
              className="flex items-center justify-between rounded-xl border border-charcoal/10 bg-sand-light/40 px-4 py-3 text-sm text-charcoal/45"
            >
              <span>{s}</span>
              <span className="text-xs uppercase tracking-wide">Soon</span>
            </div>
          )
        )}
      </div>

      <div className="mt-6 rounded-xl border border-deep-teal/20 bg-deep-teal/5 p-4 text-sm text-charcoal/70">
        Ready to create <strong>“{name || typeMeta(type).label}”</strong> with
        default styling. Click <strong>Download QR</strong> below to run it
        through the funnel.
      </div>
    </div>
  );
}
