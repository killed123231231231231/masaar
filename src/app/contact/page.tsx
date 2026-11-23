import { isReportableShortId } from "@/lib/abuse-report";
import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";
import { createClient } from "@/lib/supabase/server";
import ContactClient from "./contact-client";

export const metadata = { title: "Contact · Vertexa QR" };

// /contact serves two forms:
//  - the default "Book a demo" request, and
//  - an abuse report, reached from the "Report abuse" link on the hosted
//    scan pages (/f, /loc, /s, /v) as /contact?topic=abuse&qr=<shortId>.
// The QR id is validated here and again in /api/contact.
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const topic = typeof sp.topic === "string" ? sp.topic : undefined;
  const rawQr = typeof sp.qr === "string" ? sp.qr : undefined;
  const isAbuse = topic === "abuse";
  const qr = isAbuse && isReportableShortId(rawQr) ? rawQr : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Same header and footer as every other public page.
  return (
    <main className="flex min-h-screen flex-col bg-paper font-body text-ink">
      <SiteHeader isAuthed={!!user} userEmail={user?.email ?? null} />
      <ContactClient mode={isAbuse ? "abuse" : "demo"} reportedQr={qr} />
      <SiteFooter />
    </main>
  );
}
