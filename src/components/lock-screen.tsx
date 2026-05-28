import Link from "next/link";
import LogoMark from "@/components/logo-mark";

/**
 * Shared, server-safe lock-in screen for QRs that aren't live.
 * Mobile-first — these are scanned on phones. No client state.
 *
 * - variant="activate" → QR is pending_payment: friendly message + a
 *   checkout CTA, plus an owner login link.
 * - variant="expired"  → QR is suspended: dead-end message, no CTA.
 */
export default function LockScreen({
  variant,
  shortId,
  name,
}: {
  variant: "activate" | "expired";
  shortId: string;
  name?: string | null;
}) {
  const isActivate = variant === "activate";
  const label = name?.trim() ? `“${name.trim()}”` : "This QR code";

  return (
    <main className="grid min-h-screen place-items-center bg-sand-light px-5 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-charcoal/10 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center">
          <LogoMark className="h-10 w-10" />
        </div>

        <h1 className="mt-6 font-display text-xl font-bold text-charcoal">
          {isActivate ? "Almost there" : "This QR is no longer active"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
          {isActivate ? (
            <>
              {label} isn’t active yet. The owner needs to complete checkout
              before it can point anywhere.
            </>
          ) : (
            <>
              {label} has been switched off by its owner and no longer leads
              anywhere.
            </>
          )}
        </p>

        {isActivate ? (
          <>
            <Link
              href={`/checkout/${shortId}`}
              className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-deep-teal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta active:bg-terracotta-dark"
            >
              Activate this QR
            </Link>
            <Link
              href={`/?login=1&redirectTo=/checkout/${shortId}`}
              className="mt-4 inline-block text-xs font-medium text-charcoal/55 underline-offset-2 transition-colors hover:text-deep-teal hover:underline"
            >
              Are you the owner? Log in to activate
            </Link>
          </>
        ) : (
          <Link
            href="/"
            className="mt-7 inline-flex w-full items-center justify-center rounded-lg border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal transition-colors hover:text-deep-teal"
          >
            Make your own QR with Masaar
          </Link>
        )}
      </div>
    </main>
  );
}
