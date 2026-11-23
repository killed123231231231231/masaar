import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";
import Hero from "@/components/site/home/hero";
import ProductTabs from "@/components/site/home/product-tabs";
import Reveal from "@/components/motion/reveal";
import { Container } from "@/components/site/section";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Public homepage (2026-11 Sunbeam-style redesign). Auth state is read on
 * the server and passed to the shared header, which keeps the Log in
 * modal, profile menu and mobile sheet behaviour. Page metadata comes
 * from the root layout.
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const userEmail = user?.email ?? null;

  return (
    <main className="min-h-screen overflow-x-clip bg-paper font-body text-ink">
      <SiteHeader isAuthed={isAuthed} userEmail={userEmail} />
      <Hero />

      <section id="how" aria-labelledby="how-title" className="pb-16 md:pb-[120px]">
        <h2 id="how-title" className="sr-only">
          How it works
        </h2>
        <Container>
          <Reveal delay={120}>
            <ProductTabs />
          </Reveal>
        </Container>
      </section>
      <SiteFooter />
    </main>
  );
}
