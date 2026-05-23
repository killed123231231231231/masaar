import { redirect } from "next/navigation";
import Link from "next/link";
import { Camera, Globe2, Sparkles, Timer, Utensils, UtensilsCrossed, Zap } from "lucide-react";
import LogoMark from "@/components/logo-mark";
import Sidebar from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";

export const dynamic = "force-dynamic";

// B5/Fix 20 placeholder — promotes the AI Menu Builder as a real
// nav destination instead of a "Soon" pill stub. The actual wizard
// ships in Session F (SPRINT2.md §F: AI menu import + bilingual
// extraction + Restaurant Menu vertical). This page sets expectations
// and lets us measure interest via the "Notify me" CTA below.
export default async function MenuPlaceholderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const me = await getMe(user.id, user.email ?? "");

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-charcoal">
      <div className="flex">
        <Sidebar me={me} current="menu" />
        <main className="min-w-0 flex-1 space-y-7 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          {/* Mobile top bar — same pattern as other surfaces. */}
          <div className="flex items-center justify-between lg:hidden">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal/65 hover:text-deep-teal"
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-deep-teal p-1">
                <LogoMark className="h-full w-full brightness-0 invert" />
              </span>
              Dashboard
            </Link>
            <span className="text-xs text-charcoal/45">AI Menu Builder</span>
          </div>

          <div className="rounded-2xl border border-charcoal/10 bg-white p-8 shadow-[0_1px_2px_rgba(15,91,85,0.06),0_2px_8px_-2px_rgba(15,91,85,0.08)] sm:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-deep-teal/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-deep-teal">
                <Sparkles className="h-3.5 w-3.5" /> Coming in Session F
              </span>
              <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Restaurant Menu builder, coming soon
              </h1>
              <p className="mt-4 text-balance text-base leading-relaxed text-charcoal/65">
                Upload your paper menu — Claude Vision extracts every category,
                item, price, allergen and dietary tag in Arabic + English in
                under 30 seconds. Review, edit, publish.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <FeatureRow
                  icon={Camera}
                  title="Snap a photo, get a menu"
                  body="No data entry. Multi-page menus supported."
                />
                <FeatureRow
                  icon={Globe2}
                  title="Bilingual extraction"
                  body="Arabic + English in one pass."
                />
                <FeatureRow
                  icon={Utensils}
                  title="Allergen + halal detection"
                  body="Tagged automatically from icons + text cues."
                />
                <FeatureRow
                  icon={Timer}
                  title="30-second time-to-publish"
                  body="From paper menu to scannable QR in under a minute."
                />
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-deep-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-deep-teal-dark"
                >
                  <Zap className="h-4 w-4" /> Get early access
                </Link>
                <Link
                  href="/dashboard/qr-codes"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-5 py-2.5 text-sm font-semibold text-charcoal/75 hover:bg-sand-light hover:text-deep-teal"
                >
                  Browse your QRs
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof UtensilsCrossed;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-charcoal/10 bg-sand-light/40 p-4 text-left">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-deep-teal/10 text-deep-teal">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div>
        <p className="text-sm font-semibold text-charcoal">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-charcoal/65">{body}</p>
      </div>
    </div>
  );
}
