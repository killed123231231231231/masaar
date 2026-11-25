import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUnlocked } from "@/lib/qr-access";
import CopyButton from "./copy-button";

// Session D — hosted landing for the Location content type. Public, no auth.
export const dynamic = "force-dynamic";

interface Loc {
  lat?: number;
  lng?: number;
  label?: string;
}
interface Row {
  name: string;
  status: string;
  kind?: string;
  password_hash?: string | null;
  content_kind: string;
  payload_json: Loc | null;
}

async function resolve(shortId: string): Promise<Row | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("qr_codes")
    .select("name, kind, status, content_kind, payload_json, password_hash")
    .eq("short_id", shortId)
    .maybeSingle();
  return (data as Row) ?? null;
}

function osmEmbed(lat: number, lng: number): string {
  const d = 0.004;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortId: string }>;
}): Promise<Metadata> {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr) return { title: "Not found · Vertexa QR" };
  const p = (qr.payload_json ?? {}) as Loc;
  const title = (p.label || qr.name || "Location").trim();
  return { title: `${title} · Vertexa QR`, description: "Open this location in your maps app." };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr || qr.content_kind !== "location") notFound();
  if (qr.kind && qr.kind !== "dynamic") notFound();
  if (qr.status === "suspended") redirect(`/expired/${shortId}`);
  if (qr.status !== "active") redirect(`/activate/${shortId}`);
  // Password QRs need a valid unlock cookie here too (this URL is public).
  await requireUnlocked(shortId, qr.password_hash);

  const p = (qr.payload_json ?? {}) as Loc;
  const lat = Number(p.lat);
  const lng = Number(p.lng);
  if (!isFinite(lat) || !isFinite(lng)) notFound();

  const label = (p.label || qr.name || "").trim();
  const gmaps = `https://www.google.com/maps?q=${lat},${lng}`;
  const amaps = `https://maps.apple.com/?q=${lat},${lng}`;
  const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  return (
    <main className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto w-full max-w-md px-4 pb-12 pt-8">
        {/* One heading only: the place name, or a plain fallback. */}
        <h1 className="flex items-center justify-center gap-2 text-center font-heading text-2xl font-medium tracking-tight text-ink">
          <MapPin className="h-5 w-5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{label || "Shared location"}</span>
        </h1>

        <div className="mt-5 overflow-hidden rounded-card border border-stone-dark shadow-card">
          <iframe title={label || "Location"} src={osmEmbed(lat, lng)} className="h-72 w-full" loading="lazy" />
        </div>

        <div className="mt-5 space-y-3">
          <a
            href={gmaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-full bg-ink px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ink-soft"
          >
            Open in Google Maps
          </a>
          <a
            href={amaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-full bg-stone px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-stone-dark"
          >
            Open in Apple Maps
          </a>
          <CopyButton text={coords} />
        </div>

        <footer className="mt-10 text-center">
          <Link href="/" className="text-xs font-medium text-muted-3 transition-colors hover:text-ink">
            Made with <span className="font-semibold">Vertexa QR</span>
          </Link>
          <span aria-hidden className="mx-2 text-xs text-muted-4">·</span>
          <Link
            href={`/contact?topic=abuse&qr=${encodeURIComponent(shortId)}`}
            className="text-xs text-muted-3 transition-colors hover:text-ink"
          >
            Report abuse
          </Link>
        </footer>
      </div>
    </main>
  );
}
