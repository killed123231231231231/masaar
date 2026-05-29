import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
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
  content_kind: string;
  payload_json: Loc | null;
}

async function resolve(shortId: string): Promise<Row | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("qr_codes")
    .select("name, status, content_kind, payload_json")
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
  if (!qr) return { title: "Not found · Masaar" };
  const p = (qr.payload_json ?? {}) as Loc;
  const title = (p.label || qr.name || "Location").trim();
  return { title: `${title} · Masaar`, description: "Open this location in your maps app." };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr || qr.content_kind !== "location") notFound();
  if (qr.status !== "active") redirect(`/activate/${shortId}`);

  const p = (qr.payload_json ?? {}) as Loc;
  const lat = Number(p.lat);
  const lng = Number(p.lng);
  if (!isFinite(lat) || !isFinite(lng)) notFound();

  const label = (p.label || qr.name || "").trim();
  const gmaps = `https://www.google.com/maps?q=${lat},${lng}`;
  const amaps = `https://maps.apple.com/?q=${lat},${lng}`;
  const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  return (
    <main className="min-h-screen bg-sand-light/40">
      <div className="mx-auto w-full max-w-md px-4 pb-12 pt-8">
        <div className="flex items-center justify-center gap-2 text-deep-teal">
          <MapPin className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Location</span>
        </div>
        {label && (
          <h1 className="mt-2 text-center font-display text-xl font-bold tracking-tight text-charcoal">
            {label}
          </h1>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-charcoal/10 shadow-sm">
          <iframe title={label || "Location"} src={osmEmbed(lat, lng)} className="h-72 w-full" loading="lazy" />
        </div>

        <div className="mt-5 space-y-3">
          <a
            href={gmaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-xl bg-deep-teal px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-deep-teal-dark"
          >
            Open in Google Maps
          </a>
          <a
            href={amaps}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center rounded-xl border border-charcoal/15 bg-white px-4 py-3.5 text-sm font-semibold text-charcoal transition hover:bg-sand-light"
          >
            Open in Apple Maps
          </a>
          <CopyButton text={coords} />
        </div>

        <footer className="mt-10 text-center">
          <Link href="/" className="text-xs font-medium text-charcoal/40 transition-colors hover:text-deep-teal">
            Powered by <span className="font-semibold">Masaar</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
