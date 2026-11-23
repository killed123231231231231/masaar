import { isReportableShortId } from "@/lib/abuse-report";
import ContactClient from "./contact-client";

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

  return <ContactClient mode={isAbuse ? "abuse" : "demo"} reportedQr={qr} />;
}
