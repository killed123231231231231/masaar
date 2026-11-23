"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BarChart3, FileText, Globe, MessageCircle, Wifi, type LucideIcon } from "lucide-react";
import { AppWindow, PastelFrame, type Tint } from "@/components/site/product-frame";
import {
  AnalyticsScreen,
  PdfScreen,
  WebsiteScreen,
  WhatsAppScreen,
  WifiScreen,
} from "@/components/site/mock-screens";

type Tab = {
  key: string;
  label: string;
  icon: LucideIcon;
  tint: Tint;
  path: string;
  active: string;
  description: string;
  screen: ReactNode;
};

const TABS: Tab[] = [
  {
    key: "website",
    label: "Website",
    icon: Globe,
    tint: "lilac",
    path: "quickqrcode.live/create",
    active: "create",
    description: "The QR builder: paste a website URL and the QR preview updates as you type.",
    screen: <WebsiteScreen />,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    tint: "mint",
    path: "quickqrcode.live/create",
    active: "create",
    description: "A WhatsApp QR: enter a phone number and an optional first message.",
    screen: <WhatsAppScreen />,
  },
  {
    key: "pdf",
    label: "PDF",
    icon: FileText,
    tint: "blush",
    path: "quickqrcode.live/create",
    active: "create",
    description: "A PDF QR: upload a file up to 5 MB and the code opens it.",
    screen: <PdfScreen />,
  },
  {
    key: "wifi",
    label: "WiFi",
    icon: Wifi,
    tint: "sky",
    path: "quickqrcode.live/create",
    active: "create",
    description: "A WiFi QR: enter the network name, password and security type so guests join with one scan.",
    screen: <WifiScreen />,
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
    tint: "lilac",
    path: "quickqrcode.live/dashboard",
    active: "analytics",
    description: "The analytics view: scans over time and top cities, shown here with sample data.",
    screen: <AnalyticsScreen id="tabs-an" />,
  },
];

const AUTO_MS = 6000;

/**
 * Product tabs + pastel product frame. Tabs crossfade, auto-advance every
 * 6s (paused on hover/focus and for reduced-motion users), and support
 * arrow-key navigation.
 */
export default function ProductTabs() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % TABS.length), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, reduced]);

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const jump = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
    if (!dir && jump === null) return;
    e.preventDefault();
    setIndex((i) => {
      const next = jump ?? (i + dir + TABS.length) % TABS.length;
      tabRefs.current[next]?.focus();
      return next;
    });
  }, []);

  const current = TABS[index];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        role="tablist"
        aria-label="Product preview"
        onKeyDown={onKeyDown}
        className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((t, i) => {
          const selected = i === index;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`ptab-${t.key}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`ppanel-${t.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setIndex(i)}
              className={`inline-flex h-10 shrink-0 snap-start items-center gap-2 rounded-full px-4 font-body text-base font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
                selected ? "bg-stone text-ink" : "text-muted hover:bg-stone/60 hover:text-ink"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      <PastelFrame tint={current.tint} className="mt-6 h-[400px] sm:h-[480px] md:mt-8 lg:h-[560px]">
        {TABS.map((t, i) => {
          const selected = i === index;
          return (
            <div
              key={t.key}
              id={`ppanel-${t.key}`}
              role="tabpanel"
              aria-labelledby={`ptab-${t.key}`}
              aria-hidden={!selected}
              className={`absolute inset-0 flex justify-center px-3 pt-6 transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] sm:px-8 sm:pt-10 lg:px-[7%] lg:pt-14 ${
                selected ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
              }`}
            >
              <p className="sr-only">{t.description}</p>
              <AppWindow
                active={t.active}
                path={t.path}
                className="h-[calc(100%+24px)] w-full max-w-[1000px] rounded-b-none"
              >
                {t.screen}
              </AppWindow>
            </div>
          );
        })}
      </PastelFrame>
    </div>
  );
}
