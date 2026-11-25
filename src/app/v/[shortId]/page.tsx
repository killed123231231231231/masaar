import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUnlocked } from "@/lib/qr-access";
import { isOwnStorageAsset } from "@/lib/hosted-asset";

// C/5 — hosted landing page for the file content types (pdf/image/video).
// Public, no auth. The scan path is /r/<shortId> → (active file QR) → here.
// Status can change (active <-> suspended), and we must never serve a
// non-active asset, so render dynamically and never cache.
export const dynamic = "force-dynamic";

interface Resolved {
  name: string;
  kind: string;
  status: string;
  password_hash: string | null;
  content_kind: string;
  asset_url: string | null;
  asset_mime: string | null;
  asset_filename: string | null;
  asset_size: number | null;
}

async function resolve(shortId: string): Promise<Resolved | null> {
  // Server-side read with the service role (node page; never sent to the
  // client). Replaces the anon resolve_asset_qr RPC, which handed the file
  // URL to anyone regardless of password or status.
  const admin = createAdminClient();
  const { data } = await admin
    .from("qr_codes")
    .select(
      "name, kind, status, content_kind, destination, asset_url, asset_mime, asset_filename, asset_size, password_hash"
    )
    .eq("short_id", shortId)
    .maybeSingle();
  if (!data) return null;
  const row = data as Resolved & { destination: string };
  // asset_url falls back to destination (same rule as migration 022).
  return { ...row, asset_url: row.asset_url ?? row.destination ?? null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortId: string }>;
}): Promise<Metadata> {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr || qr.status !== "active" || qr.password_hash)
    return { title: "Vertexa QR" };
  const title = qr.name || "Shared via Vertexa QR";
  const description = "Shared with a Vertexa QR code.";
  const isImage = qr.content_kind === "image" && !!qr.asset_url;
  return {
    title: `${title} · Vertexa QR`,
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
  if (!qr || qr.kind !== "dynamic" || !qr.asset_url) notFound();

  // Lock-in: only an active QR renders its asset. Anything else bounces to
  // the activation flow (mirrors /r). This guards direct /v access too,
  // not just the scan redirect.
  if (qr.status === "suspended") redirect(`/expired/${shortId}`);
  if (qr.status !== "active") redirect(`/activate/${shortId}`);
  await requireUnlocked(shortId, qr.password_hash);
  // Only files in our own storage bucket are ever framed or embedded here.
  if (!isOwnStorageAsset(qr.asset_url, qr.content_kind)) notFound();

  const url = qr.asset_url;
  const ck = qr.content_kind;

  return (
    <main className="flex min-h-screen flex-col bg-ink">
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
            className="max-h-[calc(100vh-3rem)] w-full max-w-3xl rounded-xl"
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
            <div className="w-full max-w-sm rounded-card bg-white/5 p-8">
              <p className="font-heading text-2xl font-medium text-white">
                {qr.name}
              </p>
              <p className="mt-1 text-sm text-white/45">PDF document</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-lime px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-lime-deep"
              >
                View PDF
              </a>
            </div>
          </div>
        </>
      )}

      <footer className="shrink-0 bg-ink py-3 text-center">
        <Link
          href="/"
          className="text-xs font-medium text-white/60 transition-colors hover:text-white"
        >
          Made with <span className="font-semibold">Vertexa QR</span>
        </Link>
        <span aria-hidden className="mx-2 text-xs text-white/25">·</span>
        <Link
          href={`/contact?topic=abuse&qr=${encodeURIComponent(shortId)}`}
          className="text-xs text-white/70 transition-colors hover:text-white"
        >
          Report abuse
        </Link>
      </footer>
    </main>
  );
}
