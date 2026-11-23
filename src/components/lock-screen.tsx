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
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-12 font-body text-ink">
      <div className="w-full max-w-sm rounded-panel bg-stone p-1.5">
      <div className="rounded-[26px] border border-stone-dark bg-white p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-stone">
          <LogoMark className="h-8 w-8" />
        </div>

        <h1 className="mt-6 font-heading text-2xl font-medium text-ink">
          {isActivate ? "Almost there" : "This QR is no longer active"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-2">
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
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-soft active:bg-ink"
            >
              Activate this QR
            </Link>
            <Link
              href={`/?login=1&redirectTo=/checkout/${shortId}`}
              className="mt-4 inline-block text-xs font-medium text-muted-3 underline-offset-2 transition-colors hover:text-ink hover:underline"
            >
              Are you the owner? Log in to activate
            </Link>
          </>
        ) : (
          <Link
            href="/"
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-stone px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-stone-dark"
          >
            Make your own QR with Vertexa QR
          </Link>
        )}
      </div>
      </div>
    </main>
  );
}
