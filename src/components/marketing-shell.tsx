import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";
import { createClient } from "@/lib/supabase/server";

// Shared chrome for the remaining marketing surface (/pricing, /privacy,
// /terms). Server component with auth state fetched per-render so the
// header mirrors the homepage's auth-aware pattern — anon visitors see
// Log in + Create QR code, logged-in visitors see Dashboard + Create QR
// code + the profile menu.
//
// 2026-11 redesign — uses the same SiteHeader / SiteFooter as the
// homepage so every public page shares one header and footer.
//
// `intro` accepts a string OR a React node (for richer hero copy /
// inline toggles on the pricing page). `wide` switches max-w from
// 3xl to the full ~1170px content width for wider layouts.
export default async function MarketingShell({
  title,
  intro,
  children,
  wide = false,
}: {
  title: string;
  intro?: React.ReactNode;
  children?: React.ReactNode;
  wide?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const userEmail = user?.email ?? null;
  const maxW = wide ? "max-w-[1218px]" : "max-w-3xl";

  return (
    <main className="flex min-h-screen flex-col bg-paper font-body text-ink">
      <SiteHeader isAuthed={isAuthed} userEmail={userEmail} />

      <section className={`mx-auto w-full flex-1 ${maxW} px-4 py-14 sm:px-6 lg:py-20`}>
        <h1 className="font-heading text-[40px] font-medium leading-[1.15] tracking-[-0.02em] text-ink md:text-[54px] md:leading-[1.2]">
          {title}
        </h1>
        {intro && (
          <div className="mt-4 text-lg leading-[1.4] text-muted md:text-[21px]">
            {intro}
          </div>
        )}
        {children && (
          <div className="mt-8 space-y-6 text-base leading-[1.6] text-muted-2">
            {children}
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
