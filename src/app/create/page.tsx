import Link from "next/link";
import LogoMark from "@/components/logo-mark";
import { createClient } from "@/lib/supabase/server";
import CreateClient from "./create-client";

// Public (middleware only gates /dashboard). Anonymous visitors get the
// email-gate funnel; an already-authed user skips it and the QR is
// created straight onto their account (Bug 4).
export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;

  return (
    <main className="min-h-screen bg-sand-light/40">
      <header className="border-b border-charcoal/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-lg font-bold text-charcoal">
              Masaar
            </span>
          </Link>
          <Link
            href={isAuthed ? "/dashboard" : "/login"}
            className="text-sm font-medium text-charcoal/65 transition-colors hover:text-deep-teal"
          >
            {isAuthed ? "Dashboard" : "Log in"}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-charcoal">
            Create your QR code
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {isAuthed
              ? "Build it and we’ll add it straight to your account."
              : "Build it now — no account needed. We’ll email it to you."}
          </p>
        </div>
        <CreateClient isAuthed={isAuthed} />
      </div>
    </main>
  );
}
