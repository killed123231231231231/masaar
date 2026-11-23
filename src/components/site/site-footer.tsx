import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/components/site/site-header";
import { Container, focusRing } from "@/components/site/section";

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Website QR", href: "/create" },
      { label: "WhatsApp QR", href: "/create" },
      { label: "PDF QR", href: "/create" },
      { label: "WiFi QR", href: "/create" },
      { label: "vCard QR", href: "/create" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Vertexa", href: "https://www.vertechxa.ai", external: true },
      { label: "Contact", href: "/contact" },
      { label: "Report abuse", href: "/contact?topic=abuse" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

const linkCls = `inline-flex items-center gap-1 rounded font-body text-base text-muted-2 transition-colors duration-200 hover:text-ink ${focusRing}`;

/**
 * Shared site footer: a white rounded card with a stone border inside the
 * page width, sitting on soft pastel cloud shapes.
 */
export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden pb-6 pt-10 md:pb-8 md:pt-16">
      {/* Soft background clouds behind the bottom of the page. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px]">
        <div className="absolute -left-24 bottom-[-160px] h-[360px] w-[520px] rounded-full bg-sky/40 blur-3xl" />
        <div className="absolute left-1/3 bottom-[-200px] h-[360px] w-[560px] rounded-full bg-lilac/35 blur-3xl" />
        <div className="absolute -right-24 bottom-[-150px] h-[340px] w-[480px] rounded-full bg-mint/35 blur-3xl" />
      </div>

      <Container className="relative">
        <div className="rounded-card border border-stone-dark bg-white p-6 sm:p-10 lg:p-12">
          <div className="grid gap-10 md:grid-cols-[1.3fr_2fr]">
            <div className="flex flex-col items-start gap-5">
              <Link href="/" aria-label="Vertexa QR home" className={`rounded-lg ${focusRing}`}>
                <Wordmark />
              </Link>
              <p className="max-w-xs font-body text-base leading-[1.4] text-muted-2">
                Dynamic QR codes you can edit after printing, with scan
                analytics built in.
              </p>
              <a
                href="https://www.vertechxa.ai"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 rounded-full bg-stone px-3.5 py-1.5 font-body text-sm font-medium text-ink transition-colors duration-200 hover:bg-stone-dark ${focusRing}`}
              >
                Powered by Vertexa
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {COLUMNS.map((col) => (
                <div key={col.title}>
                  <h2 className="font-heading text-lg font-semibold text-ink">{col.title}</h2>
                  <ul className="mt-4 space-y-3">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        {l.external ? (
                          <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                            {l.label}
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        ) : (
                          <Link href={l.href} className={linkCls}>
                            {l.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 border-t border-stone pt-6 font-body text-sm text-muted-3">
            <p>
              © {year} Vertexa QR. Powered by{" "}
              <a
                href="https://www.vertechxa.ai"
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded font-medium text-ink underline-offset-4 hover:underline ${focusRing}`}
              >
                Vertexa
              </a>
              .
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
