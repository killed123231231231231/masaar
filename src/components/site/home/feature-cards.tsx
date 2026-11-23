import type { ReactNode } from "react";
import { ArrowDown, BarChart3, Palette, PencilLine, type LucideIcon } from "lucide-react";
import Reveal from "@/components/motion/reveal";
import MockQr from "@/components/site/mock-qr";
import { ScanChart, UpdatedToast } from "@/components/site/mock-screens";
import { Container, SectionTitle } from "@/components/site/section";

type Card = {
  title: string;
  body: string;
  icon: LucideIcon;
  vignette: ReactNode;
  active?: boolean;
};

function TrackVignette() {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-3.5 font-sans shadow-card ring-1 ring-ink/[0.05]">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-ink">Scans by day</span>
        <span className="rounded-full bg-stone px-2 py-0.5 text-[10px] font-medium text-ink">Sample data</span>
      </div>
      <ScanChart id="fc-track" className="mt-2 w-full flex-1" />
      <div className="mt-2 flex gap-1.5 text-[11px] font-medium text-ink">
        <span className="rounded-full bg-lilac/60 px-2 py-0.5">Riyadh</span>
        <span className="rounded-full bg-sky/60 px-2 py-0.5">iPhone</span>
        <span className="rounded-full bg-mint/60 px-2 py-0.5">Android</span>
      </div>
    </div>
  );
}

function EditVignette() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 rounded-2xl bg-white p-3.5 font-sans shadow-card ring-1 ring-ink/[0.05]">
      <div className="text-[11px] font-medium text-muted-2">Destination URL</div>
      <div className="truncate rounded-lg bg-stone px-3 py-2 text-[12px] text-muted-3 line-through decoration-ink/40">
        yourcafe.com/spring-menu
      </div>
      <ArrowDown className="mx-auto h-3.5 w-3.5 text-muted-3" />
      <div className="truncate rounded-lg border border-ink/70 bg-white px-3 py-2 text-[12px] text-ink shadow-[0_0_0_3px_rgba(219,252,116,0.7)]">
        yourcafe.com/summer-menu
      </div>
    </div>
  );
}

function DesignVignette() {
  return (
    <div className="grid h-full grid-cols-3 items-center gap-2.5 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-ink/[0.05]">
      <div className="rounded-xl bg-sky/60 p-2">
        <MockQr seed="fc1" dot="rounded" corner="rounded" className="aspect-square w-full overflow-hidden rounded-md" />
      </div>
      <div className="rounded-xl bg-lime/70 p-2">
        <MockQr seed="fc2" dot="dots" corner="rounded" className="aspect-square w-full overflow-hidden rounded-md" />
      </div>
      <div className="rounded-xl bg-lilac/60 p-2">
        <MockQr seed="fc3" dot="rounded" corner="rounded" logo className="aspect-square w-full overflow-hidden rounded-md" />
      </div>
    </div>
  );
}

// The middle card is the "active" one and carries the floating
// "Destination updated" snippet, so the dynamic-editing card sits there.
const CARDS: Card[] = [
  {
    title: "Track every scan",
    body: "See scans by day, city and device.",
    icon: BarChart3,
    vignette: <TrackVignette />,
  },
  {
    title: "Edit after printing",
    body: "Change where a dynamic QR points without reprinting it.",
    icon: PencilLine,
    vignette: <EditVignette />,
    active: true,
  },
  {
    title: "Make it yours",
    body: "Colours, logo, rounded dots and frames.",
    icon: Palette,
    vignette: <DesignVignette />,
  },
];

/** Three framed feature cards (stone outer frame, white inner card). */
export default function FeatureCards() {
  return (
    <section id="features" aria-labelledby="features-title" className="py-16 md:py-[72px]">
      <Container>
        <SectionTitle id="features-title" className="max-w-[720px]">
          Print once, stay in control
        </SectionTitle>

        <div className="mt-10 grid gap-5 md:mt-14 md:grid-cols-3 lg:gap-6">
          {CARDS.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 100} className="h-full">
                <article
                  className={`group relative h-full rounded-[30px] p-2 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-card ${
                    c.active ? "bg-stone-dark" : "bg-stone"
                  }`}
                >
                  {c.active && (
                    <UpdatedToast className="absolute -top-5 right-4 z-10 hidden animate-float-y lg:flex" />
                  )}
                  <div className="flex h-full flex-col rounded-card bg-white p-6 lg:p-7">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-full transition-colors duration-300 ${
                        c.active ? "bg-lime" : "bg-stone group-hover:bg-lime"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-ink" aria-hidden />
                    </span>
                    <h3 className="mt-6 font-heading text-2xl font-medium leading-[1.2] tracking-[-0.01em] text-ink">
                      {c.title}
                    </h3>
                    <p className="mt-2 font-body text-base leading-[1.4] text-muted-2">{c.body}</p>
                    <div
                      aria-hidden
                      className={`mt-6 h-[164px] rounded-[20px] bg-cream p-3 transition-opacity duration-300 ${
                        c.active ? "opacity-100" : "opacity-100 md:opacity-70 md:group-hover:opacity-100"
                      }`}
                    >
                      {c.vignette}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
