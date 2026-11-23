import type { ReactNode } from "react";
import Reveal from "@/components/motion/reveal";
import { PrimaryButton } from "@/components/site/buttons";
import { AppWindow, PastelFrame, type Tint } from "@/components/site/product-frame";
import {
  AnalyticsScreen,
  DesignStudioScreen,
  EditDestinationScreen,
} from "@/components/site/mock-screens";
import { Container, SectionTitle } from "@/components/site/section";

type Panel = {
  key: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  tint: Tint;
  window: { active: string; path: string; screen: ReactNode };
  description: string;
};

const PANELS: Panel[] = [
  {
    key: "dynamic",
    title: "Dynamic QR codes",
    body: "A dynamic QR points to a short link you control. Change where it goes, pause it or add a password, and the printed code keeps working.",
    cta: { label: "Create a dynamic QR", href: "/create" },
    tint: "lilac",
    window: { active: "codes", path: "quickqrcode.live/dashboard/qr", screen: <EditDestinationScreen /> },
    description: "Editing a QR code's destination URL, with switches to pause it or require a password.",
  },
  {
    key: "analytics",
    title: "Scan analytics",
    body: "Every scan of a dynamic QR is counted. See when, where and on which device people scan, and download the data when you need it.",
    cta: { label: "Open your dashboard", href: "/dashboard" },
    tint: "sky",
    window: { active: "analytics", path: "quickqrcode.live/dashboard", screen: <AnalyticsScreen id="panel-an" /> },
    description: "The analytics dashboard with total scans, a scans-over-time chart and top cities, shown with sample data.",
  },
  {
    key: "design",
    title: "Design studio",
    body: "Match your brand and keep the code easy to scan. Pick colours, put your logo in the middle and add a frame with a short call to action.",
    cta: { label: "Design your QR", href: "/create" },
    tint: "mint",
    window: { active: "create", path: "quickqrcode.live/create", screen: <DesignStudioScreen /> },
    description: "The design step with style samples: classic, rounded, dots, gradient, logo and framed QR codes.",
  },
];

/**
 * Stick only on large screens that are also tall enough to show a whole
 * panel (top offset + 540px min height + CTA). On short laptops (e.g.
 * 1280x600 inner height) the panels scroll normally so no CTA is hidden.
 */
const STICKY_TOP = [
  "[@media(min-width:1024px)_and_(min-height:780px)]:sticky [@media(min-width:1024px)_and_(min-height:780px)]:top-[100px]",
  "[@media(min-width:1024px)_and_(min-height:780px)]:sticky [@media(min-width:1024px)_and_(min-height:780px)]:top-[120px]",
  "[@media(min-width:1024px)_and_(min-height:780px)]:sticky [@media(min-width:1024px)_and_(min-height:780px)]:top-[140px]",
];

/** Three big stone panels that stack as you scroll (sticky on desktop). */
export default function StackedPanels() {
  return (
    <section aria-labelledby="panels-title" className="py-16 md:py-[72px]">
      <Container>
        <SectionTitle id="panels-title" align="left" className="max-w-[640px]">
          Everything a QR code should do
        </SectionTitle>

        <div className="mt-10 space-y-6 md:mt-14 lg:space-y-10">
          {PANELS.map((p, i) => (
            <Reveal key={p.key} className={STICKY_TOP[i]}>
              <article
                aria-labelledby={`panel-${p.key}`}
                className="grid gap-8 rounded-panel bg-stone p-5 shadow-[0_-12px_32px_-24px_rgba(26,26,26,0.25)] sm:p-8 lg:min-h-[540px] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-10 lg:p-10"
              >
                <div className="flex flex-col lg:justify-center lg:py-6">
                  <h3
                    id={`panel-${p.key}`}
                    className="font-heading text-[32px] font-medium leading-[1.15] tracking-[-0.02em] text-ink md:text-[42px] md:leading-[1.2]"
                  >
                    {p.title}
                  </h3>
                  <p className="mt-5 max-w-[440px] font-body text-base leading-[1.5] text-muted-2 md:text-lg">{p.body}</p>
                  <div className="mt-8 lg:mt-10">
                    <PrimaryButton href={p.cta.href} className="hover:!bg-white">
                      {p.cta.label}
                    </PrimaryButton>
                  </div>
                </div>

                <div className="relative">
                  <p className="sr-only">{p.description}</p>
                  <PastelFrame tint={p.tint} className="h-[320px] sm:h-[420px] lg:h-full lg:min-h-[460px]">
                    <div className="absolute inset-0 flex justify-center px-3 pt-5 sm:px-6 sm:pt-8 lg:px-7 lg:pt-10">
                      <AppWindow
                        active={p.window.active}
                        path={p.window.path}
                        className="h-[calc(100%+24px)] w-full rounded-b-none"
                      >
                        {p.window.screen}
                      </AppWindow>
                    </div>
                  </PastelFrame>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
