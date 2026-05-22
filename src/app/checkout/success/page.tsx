import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import LogoMark from "@/components/logo-mark";

// Public success page for the anon checkout path. The user has no
// browser session (admin.createUser doesn't set one) so we deliberately
// land them here instead of /dashboard (middleware-gated). The welcome
// email contains the magic-link login they use to access the dashboard
// next time. Post-checkout auto-login is BACKLOGed.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";

  return (
    <main className="grid min-h-screen place-items-center bg-sand-light/40 px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-charcoal/10 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-deep-teal/10 text-deep-teal">
          <CheckCircle2 className="h-8 w-8" />
        </span>

        <h1 className="mt-5 font-display text-2xl font-bold text-charcoal">
          Your QR is live!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
          Account created and QR activated.{" "}
          {email ? (
            <>
              We sent a welcome email to <strong>{email}</strong> with your
              QR attached and a magic link to log in.
            </>
          ) : (
            <>We sent a welcome email with your QR attached and a magic link to log in.</>
          )}
        </p>

        <div className="mt-6 rounded-xl bg-sand-light/70 p-4 text-left text-xs text-charcoal/60">
          <p>
            <strong>Next time you visit:</strong> click <em>“Log in”</em>{" "}
            from the email gate to get a one-time magic link — no password
            needed.
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal transition-colors hover:text-deep-teal"
        >
          <LogoMark className="h-4 w-4" />
          Back to home
        </Link>

        <p className="mt-3 text-center text-xs text-charcoal/45">
          Tip: the QR you downloaded works now — try scanning it.
        </p>
      </div>
    </main>
  );
}
