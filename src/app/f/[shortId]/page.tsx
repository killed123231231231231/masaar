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
  if (!qr) return { title: "Not found · Masaar" };
  const c = (qr.payload_json ?? {}) as Cfg;
  return {
    title: `${c.headline || "Share your feedback"} · Masaar`,
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sand-light to-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
        {qr.name && (
          <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wider text-deep-teal">
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
            className="text-xs font-medium text-charcoal/40 transition-colors hover:text-deep-teal"
          >
            Powered by <span className="font-semibold">Masaar</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
