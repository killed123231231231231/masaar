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
  if (!qr) return { title: "Not found · Masaar" };
  const p = (qr.payload_json ?? {}) as SocialProfile;
  const title = p.display_name || qr.name || "Profile";
  return {
    title: `${title} · Masaar`,
    description: p.bio || "Find me on social — shared via Masaar.",
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
    <main className="min-h-screen bg-gradient-to-b from-sand-light to-white">
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-6 pb-12 pt-16 text-center">
        {p.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.avatar_url}
            alt={name}
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
          />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-full bg-deep-teal font-display text-2xl font-bold text-white shadow-md">
            {initials}
          </div>
        )}

        {name && (
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-charcoal">
            {name}
          </h1>
        )}
        {p.bio && (
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-charcoal/60">{p.bio}</p>
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
                  className="flex items-center gap-3 rounded-xl border border-charcoal/10 bg-white px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase text-white"
                    style={{ background: m.color }}
                  >
                    {m.label.slice(0, 2)}
                  </span>
                  <span className="flex-1 text-left font-semibold text-charcoal">{m.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-charcoal/30" />
                </a>
              );
            })}
          </div>
        )}

        <footer className="mt-12">
          <Link
            href="/"
            className="text-xs font-medium text-charcoal/40 transition-colors hover:text-deep-teal"
          >
            Powered by <span className="font-semibold">Masaar</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
