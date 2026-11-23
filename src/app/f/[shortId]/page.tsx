import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import FeedbackWidget from "./feedback-widget";

// Session D — hosted feedback form. Public, no auth.
export const dynamic = "force-dynamic";

interface Cfg {
  headline?: string;
  prompt?: string;
  ask_email?: boolean;
}
interface Row {
  name: string;
  status: string;
  content_kind: string;
  payload_json: Cfg | null;
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shortId: string }>;
}): Promise<Metadata> {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr) return { title: "Not found · Vertexa QR" };
  const c = (qr.payload_json ?? {}) as Cfg;
  return {
    title: `${c.headline || "Share your feedback"} · Vertexa QR`,
    description: "Tell us about your experience.",
  };
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
  const qr = await resolve(shortId);
  if (!qr || qr.content_kind !== "feedback") notFound();
  if (qr.status !== "active") redirect(`/activate/${shortId}`);

  const c = (qr.payload_json ?? {}) as Cfg;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper font-body text-ink px-4 py-10">
      <div className="w-full max-w-md rounded-panel border border-stone-dark bg-white p-6 shadow-card sm:p-8">
        {qr.name && (
          <p className="mx-auto mb-3 w-fit rounded-full bg-stone px-3 py-1 text-center text-xs font-medium text-ink">
            {qr.name}
          </p>
        )}
        <FeedbackWidget
          shortId={shortId}
          headline={c.headline || "How was your experience?"}
          prompt={c.prompt || "Tell us more"}
          askEmail={!!c.ask_email}
        />
        <footer className="mt-8 text-center">
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
