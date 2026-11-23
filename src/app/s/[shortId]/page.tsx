import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseHttpUrl } from "@/lib/url";
import { platformMeta } from "@/app/create/_lib/social-platforms";

// Session D — hosted bio-link page for the Social Media content type.
// Public, no auth. Scan path: /r/<shortId> → (active social QR) → here.
// Status can flip, so render dynamically and never cache.
export const dynamic = "force-dynamic";

interface SocialProfile {
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
  links?: { platform: string; url: string }[];
}
interface Row {
  name: string;
  status: string;
  content_kind: string;
  payload_json: SocialProfile | null;
}

async function resolve(shortId: string): Promise<Row | null> {
  // Service-role read — qr_codes has no public read policy. We only ever
  // expose the safe profile fields below to the client (never password_hash).
  const admin = createAdminClient();
  const { data } = await admin
    .from("qr_codes")
    .select("name, status, content_kind, payload_json")
    .eq("short_id", shortId)
    .maybeSingle();
  return (data as Row) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortId: string }>;
}): Promise<Metadata> {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr) return { title: "Not found · Vertexa QR" };
  const p = (qr.payload_json ?? {}) as SocialProfile;
  const title = p.display_name || qr.name || "Profile";
  return {
    title: `${title} · Vertexa QR`,
    description: p.bio || "Find me on social — shared via Vertexa QR.",
    openGraph: {
      title,
      description: p.bio || "Find me on social.",
      images: p.avatar_url ? [{ url: p.avatar_url }] : undefined,
    },
  };
}

export default async function SocialPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr || qr.content_kind !== "social") notFound();
  if (qr.status !== "active") redirect(`/activate/${shortId}`);

  const p = (qr.payload_json ?? {}) as SocialProfile;
  const name = (p.display_name || qr.name || "").trim();
  const initials =
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "·";

  // Sanitize every link to a real http(s) URL — never render javascript:/data:.
  const links = (Array.isArray(p.links) ? p.links : [])
    .map((l) => ({ ...l, safe: parseHttpUrl(l.url)?.toString() }))
    .filter((l): l is { platform: string; url: string; safe: string } => !!l.safe);

  return (
    <main className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 pb-12 pt-16 text-center">
        {p.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.avatar_url}
            alt={name}
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
          />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-full bg-ink font-heading text-[28px] font-medium tracking-[-0.02em] text-white shadow-md">
            {initials}
          </div>
        )}

        {name && (
          <h1 className="mt-4 font-heading text-[28px] font-medium tracking-[-0.02em] text-ink">
            {name}
          </h1>
        )}
        {p.bio && (
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-2">{p.bio}</p>
        )}

        {links.length > 0 && (
          <div className="mt-8 w-full space-y-3">
            {links.map((l, i) => {
              const m = platformMeta(l.platform);
              return (
                <a
                  key={`${l.platform}-${i}`}
                  href={l.safe}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-3 rounded-card border border-stone-dark bg-white px-4 py-3.5 transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold uppercase text-white"
                    style={{ background: m.color }}
                  >
                    {m.label.slice(0, 2)}
                  </span>
                  <span className="flex-1 text-left font-semibold text-ink">{m.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-4" />
                </a>
              );
            })}
          </div>
        )}

        <footer className="mt-12">
          <Link
            href="/"
            className="text-xs font-medium text-muted-3 transition-colors hover:text-ink"
          >
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
