import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import LogoMark from "@/components/logo-mark";

// Public success page for the anon checkout path. The user has no
// browser session (admin.createUser doesn't set one), so we land them
// here instead of /dashboard (middleware-gated). The welcome email
// contains email + password (Fix 22) — magic-link / password-reset
// stays available as Bug 16's fallback but is no longer the primary
// login path. Copy reflects that.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-12 font-body text-ink">
      <div className="w-full max-w-md rounded-panel border border-stone-dark bg-white p-8 text-center shadow-card">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime text-ink">
          <CheckCircle2 className="h-8 w-8" />
        </span>

        <h1 className="mt-5 font-heading text-[28px] font-medium tracking-[-0.02em] text-ink">
          Your QR is live!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-2">
          Account created and QR activated.{" "}
          {email ? (
            <>
              We sent the QR + your login credentials (email and password) to{" "}
              <strong>{email}</strong>.
            </>
          ) : (
            <>
              We sent the QR + your login credentials (email and password) to
              your inbox.
            </>
          )}
        </p>

        <div className="mt-6 rounded-xl bg-stone/60 p-4 text-left text-xs text-muted-2">
          <p>
            <strong>Next time you visit:</strong> click <em>“Log in”</em> in
            the header and use the email + password from your welcome email.
            You can change the password anytime in Settings.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-stone-dark"
        >
          <LogoMark className="h-4 w-4" />
          Back to home
        </Link>

        {/* B5/Audit M5 — copy rewritten. The previous text implied
            a file download ("the QR you downloaded"), but the anon-
            checkout flow never actually downloads a file to the
            user's machine — the QR is attached in the welcome
            email. New copy points at the email-attached QR. */}
        <p className="mt-3 text-center text-xs text-muted-3">
          Tip: scan the QR in your inbox to see your destination live.
        </p>
      </div>
    </main>
  );
}
