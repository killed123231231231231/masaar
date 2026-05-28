import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

// C/5 — hosted landing page for the file content types (pdf/image/video).
// Public, no auth. The scan path is /r/<shortId> → (active file QR) → here.
// Status can change (active <-> suspended), and we must never serve a
// non-active asset, so render dynamically and never cache.
export const dynamic = "force-dynamic";

interface Resolved {
  name: string;
  status: string;
  content_kind: string;
  asset_url: string | null;
  asset_mime: string | null;
  asset_filename: string | null;
  asset_size: number | null;
}

async function resolve(shortId: string): Promise<Resolved | null> {
  const supabase = await createClient();
  // resolve_asset_qr is a SECURITY DEFINER reader (qr_codes has no public
  // read). asset_url falls back to `destination` (migration 022).
  const { data } = await supabase.rpc("resolve_asset_qr", {
    p_short_id: shortId,
  });
  const row = Array.isArray(data) ? data[0] : null;
  return (row as Resolved) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortId: string }>;
}): Promise<Metadata> {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr) return { title: "Not found · Masaar" };
  const title = qr.name || "Shared via Masaar";
  const description = "Shared with a Masaar QR code.";
  const isImage = qr.content_kind === "image" && !!qr.asset_url;
  return {
    title: `${title} · Masaar`,
    description,
    openGraph: {
      title,
      description,
      images: isImage ? [{ url: qr.asset_url as string }] : undefined,
    },
  };
}

export default async function HostedAssetPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr || !qr.asset_url) notFound();

  // Lock-in: only an active QR renders its asset. Anything else bounces to
  // the activation flow (mirrors /r). This guards direct /v access too,
  // not just the scan redirect.
  if (qr.status !== "active") redirect(`/activate/${shortId}`);

  const url = qr.asset_url;
  const ck = qr.content_kind;

  return (
    <main className="flex min-h-screen flex-col bg-charcoal">
      {ck === "image" && (
        <div className="flex flex-1 items-center justify-center p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={qr.name}
            className="max-h-[calc(100vh-3rem)] w-auto max-w-full object-contain"
          />
        </div>
      )}

      {ck === "video" && (
        <div className="flex flex-1 items-center justify-center p-2">
          {/* muted + playsInline are required for iOS autoplay / no
              forced-fullscreen. */}
          <video
            src={url}
            controls
            autoPlay
            muted
            playsInline
            className="max-h-[calc(100vh-3rem)] w-full max-w-3xl rounded-lg"
          />
        </div>
      )}

      {ck === "pdf" && (
        <>
          {/* Desktop: inline iframe. */}
          <iframe
            src={url}
            title={qr.name}
            className="hidden w-full flex-1 md:block"
          />
          {/* Mobile: iframes for PDF are unreliable, so a clean CTA. */}
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center md:hidden">
            <div className="w-full max-w-sm rounded-2xl bg-white/5 p-8">
              <p className="font-display text-lg font-bold text-white">
                {qr.name}
              </p>
              <p className="mt-1 text-sm text-white/45">PDF document</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-deep-teal px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep-teal-dark"
              >
                View PDF
              </a>
            </div>
          </div>
        </>
      )}

      <footer className="shrink-0 bg-charcoal py-3 text-center">
        <Link
          href="/"
          className="text-xs font-medium text-white/40 transition-colors hover:text-white/70"
        >
          Powered by <span className="font-semibold">Masaar</span>
        </Link>
      </footer>
    </main>
  );
}
