import type { ReactNode } from "react";
import {
  Check,
  ChevronLeft,
  FileText,
  Globe,
  Link2,
  Lock,
  MessageCircle,
  Phone,
  Upload,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import MockQr from "@/components/site/mock-qr";
import { ChipMock, FieldMock, SwitchMock } from "@/components/site/product-frame";

/**
 * Mock Vertexa QR screens for the marketing product frames. They depict
 * real product features (builder steps, dynamic editing, analytics,
 * design options). Example values are placeholders; analytics figures are
 * labelled "Sample data".
 */

/* ───────────────────────────── Builder ───────────────────────────── */

function Steps() {
  const steps = [
    { label: "Type", state: "done" },
    { label: "Content", state: "active" },
    { label: "Design", state: "todo" },
  ] as const;
  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      {steps.map((s, i) => (
        <span
          key={s.label}
          className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium ${
            s.state === "active"
              ? "bg-ink text-white"
              : s.state === "done"
                ? "bg-stone text-ink"
                : "text-muted-3 ring-1 ring-ink/[0.08]"
          }`}
        >
          {s.state === "done" ? (
            <Check className="h-3 w-3" strokeWidth={3} />
          ) : (
            <span className="text-[11px] opacity-70">{i + 1}</span>
          )}
          {s.label}
        </span>
      ))}
    </div>
  );
}

function BuilderShell({
  icon: Icon,
  type,
  dynamic = true,
  children,
  seed,
  previewNote,
}: {
  icon: LucideIcon;
  type: string;
  dynamic?: boolean;
  children: ReactNode;
  seed: string;
  previewNote: string;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-3">QR codes / New</div>
          <div className="truncate text-[15px] font-semibold tracking-[-0.01em]">Create QR code</div>
        </div>
        <Steps />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_104px] gap-3 sm:grid-cols-[1fr_190px] sm:gap-4 lg:grid-cols-[1fr_224px]">
        <div className="flex min-w-0 flex-col gap-3.5 rounded-xl border border-ink/[0.07] p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-lime">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[13px] font-semibold">{type}</span>
            <ChipMock tone={dynamic ? "lime" : "stone"}>{dynamic ? "Dynamic" : "Static"}</ChipMock>
          </div>
          {children}
          {dynamic && (
            <div className="mt-auto hidden items-center justify-between gap-3 rounded-lg bg-cream px-3 py-2.5 sm:flex">
              <div>
                <div className="text-[12px] font-medium">Track scans</div>
                <div className="text-[11px] text-muted-3">Edit the destination after printing</div>
              </div>
              <SwitchMock on />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-center gap-2.5 rounded-xl bg-cream p-2.5 sm:p-4">
          <div className="w-full rounded-lg bg-white p-1.5 shadow-card sm:p-2.5">
            <MockQr seed={seed} dot="rounded" corner="rounded" className="aspect-square w-full" />
          </div>
          <div className="text-center text-[11px] text-muted-3">{previewNote}</div>
          <div className="hidden gap-1.5 sm:flex">
            <ChipMock tone="ink">Download PNG</ChipMock>
            <ChipMock tone="white">SVG</ChipMock>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WebsiteScreen() {
  return (
    <BuilderShell icon={Globe} type="Website" seed="website" previewNote="Live preview">
      <FieldMock label="Website URL" value="https://yourcafe.com/menu" icon={Link2} focused />
      <FieldMock label="QR name" value="Table card, ground floor" />
    </BuilderShell>
  );
}

export function WhatsAppScreen() {
  return (
    <BuilderShell icon={MessageCircle} type="WhatsApp" seed="whatsapp" previewNote="Opens a chat">
      <FieldMock label="Phone number" value="+966 5X XXX XXXX" icon={Phone} />
      <div>
        <div className="mb-1.5 text-[12px] font-medium text-muted-2">Message</div>
        <div className="rounded-lg border border-ink/70 bg-white px-3 py-2 text-[13px] leading-[1.45] shadow-[0_0_0_3px_rgba(219,252,116,0.7)]">
          Hi, I would like to book a table for tonight.
        </div>
      </div>
    </BuilderShell>
  );
}

export function PdfScreen() {
  return (
    <BuilderShell icon={FileText} type="PDF" seed="pdf" previewNote="Opens the PDF">
      <div className="flex items-center gap-3 rounded-lg border border-ink/10 p-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blush/70">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium">menu.pdf</div>
          <div className="text-[11px] text-muted-3">1.2 MB · Uploaded</div>
          <div className="mt-1.5 h-1 rounded-full bg-stone">
            <div className="h-1 w-full rounded-full bg-ink" />
          </div>
        </div>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      </div>
      <div className="hidden items-center justify-center gap-2 rounded-lg border border-dashed border-ink/15 py-3 text-[12px] text-muted-3 sm:flex">
        <Upload className="h-3.5 w-3.5" /> Replace file · PDF up to 5 MB
      </div>
      <FieldMock label="Title" value="Lunch menu" />
    </BuilderShell>
  );
}

export function WifiScreen() {
  return (
    <BuilderShell icon={Wifi} type="WiFi" dynamic={false} seed="wifi" previewNote="Joins the network">
      <FieldMock label="Network name" value="Cafe-Guest" icon={Wifi} />
      <FieldMock label="Password" value="••••••••••" icon={Lock} mono focused />
      <div>
        <div className="mb-1.5 text-[12px] font-medium text-muted-2">Security</div>
        <div className="inline-flex rounded-lg bg-stone p-0.5 text-[12px] font-medium">
          <span className="rounded-md bg-white px-2.5 py-1 shadow-card">WPA/WPA2</span>
          <span className="px-2.5 py-1 text-muted-3">WEP</span>
          <span className="px-2.5 py-1 text-muted-3">None</span>
        </div>
      </div>
    </BuilderShell>
  );
}

/* ───────────────────────────── Analytics ───────────────────────────── */

const SERIES = [
  18, 22, 20, 27, 31, 26, 24, 30, 36, 33, 29, 35, 41, 38, 34, 40, 46, 43, 39, 47, 52, 48, 45, 51, 58, 54, 50, 57, 63, 60,
];

function chartPaths(w: number, h: number) {
  const max = 70;
  const pts = SERIES.map((v, i) => [(i / (SERIES.length - 1)) * w, h - (v / max) * h] as const);
  let line = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    line += `C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  const area = `${line}L${w},${h}L0,${h}Z`;
  return { line, area };
}

const CITIES = [
  { name: "Riyadh", pct: 38, bar: "bg-ink" },
  { name: "Jeddah", pct: 24, bar: "bg-lilac" },
  { name: "Madinah", pct: 17, bar: "bg-sky" },
  { name: "Dammam", pct: 11, bar: "bg-mint" },
];

export function ScanChart({ id, className = "" }: { id: string; className?: string }) {
  const { line, area } = chartPaths(300, 110);
  return (
    <svg viewBox="0 0 300 118" preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DBFC74" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#DBFC74" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[28, 56, 84].map((y) => (
        <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="#1A1A1A" strokeOpacity="0.06" />
      ))}
      <path d={area} fill={`url(#${id}-area)`} />
      <path d={line} fill="none" stroke="#1A1A1A" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function CityBars({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      {CITIES.map((c) => (
        <div key={c.name}>
          <div className="mb-1 flex justify-between text-[12px]">
            <span className="font-medium">{c.name}</span>
            <span className="text-muted-3">{c.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-stone">
            <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${(c.pct / 40) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsScreen({ id = "an" }: { id?: string }) {
  const kpis = [
    { label: "Total scans", value: "1,284" },
    { label: "Unique scanners", value: "962" },
    { label: "Active codes", value: "8" },
  ];
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-3">Overview</div>
          <div className="truncate text-[15px] font-semibold tracking-[-0.01em]">Analytics</div>
        </div>
        <div className="flex gap-1.5">
          <span className="hidden sm:inline-flex">
            <ChipMock tone="white">Last 30 days</ChipMock>
          </span>
          <ChipMock>Sample data</ChipMock>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-ink/[0.07] p-2.5 sm:p-3">
            <div className="truncate text-[11px] text-muted-3">{k.label}</div>
            <div className="mt-1 text-[17px] font-semibold tracking-[-0.02em] sm:text-[20px]">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-[1.55fr_1fr]">
        <div className="flex min-h-[130px] flex-col rounded-xl border border-ink/[0.07] p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium">Scans over time</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-3">
              <span className="h-2 w-2 rounded-full bg-ink" /> Scans
            </span>
          </div>
          <ScanChart id={id} className="mt-3 h-full min-h-[80px] w-full flex-1" />
        </div>
        <div className="hidden rounded-xl border border-ink/[0.07] p-3 sm:block sm:p-4">
          <div className="mb-3 text-[12px] font-medium">Top cities</div>
          <CityBars />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Edit destination ─────────────────────────── */

export function EditDestinationScreen() {
  return (
    <div className="relative flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-stone">
            <ChevronLeft className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-3">QR codes</div>
            <div className="truncate text-[15px] font-semibold tracking-[-0.01em]">Spring menu</div>
          </div>
        </div>
        <ChipMock tone="white">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-deep" /> Active
        </ChipMock>
      </div>

      <div className="grid gap-3 sm:grid-cols-[150px_1fr] sm:gap-4">
        <div className="hidden flex-col items-center gap-2 rounded-xl bg-cream p-3 sm:flex">
          <div className="w-full rounded-lg bg-white p-2 shadow-card">
            <MockQr seed="spring" className="aspect-square w-full" />
          </div>
          <div className="w-full truncate text-center text-[11px] text-muted-3">quickqrcode.live/r/…</div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <FieldMock
            label="Destination URL"
            value="https://yourcafe.com/summer-menu"
            icon={Link2}
            focused
            hint="Was https://yourcafe.com/spring-menu"
          />
          <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.07]">
            {[
              { label: "Active", sub: "Pause and resume scans", on: true },
              { label: "Password", sub: "Ask for a password first", on: false },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-[12px] font-medium">{r.label}</div>
                  <div className="truncate text-[11px] text-muted-3">{r.sub}</div>
                </div>
                <SwitchMock on={r.on} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <span className="inline-flex h-8 items-center rounded-full bg-ink px-3.5 text-[12px] font-medium text-white">
              Save changes
            </span>
            <span className="inline-flex h-8 items-center rounded-full bg-stone px-3.5 text-[12px] font-medium">
              Cancel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Design studio ───────────────────────────── */

export function DesignStudioScreen() {
  const samples: { label: string; node: ReactNode; tile: string }[] = [
    { label: "Classic", tile: "bg-white", node: <MockQr seed="d1" className="aspect-square w-full" /> },
    {
      label: "Rounded",
      tile: "bg-sky/60",
      node: <MockQr seed="d2" dot="rounded" corner="rounded" bg="#FFFFFF" className="aspect-square w-full overflow-hidden rounded-md" />,
    },
    {
      label: "Dots",
      tile: "bg-lime/70",
      node: <MockQr seed="d3" dot="dots" corner="rounded" className="aspect-square w-full overflow-hidden rounded-md" />,
    },
    {
      label: "Gradient",
      tile: "bg-lilac/50",
      node: <MockQr seed="d4" dot="rounded" corner="rounded" gradientTo="#535353" id="ds-grad" className="aspect-square w-full overflow-hidden rounded-md" />,
    },
    {
      label: "Logo",
      tile: "bg-white",
      node: <MockQr seed="d5" dot="rounded" corner="rounded" logo className="aspect-square w-full" />,
    },
    {
      label: "Frame",
      tile: "bg-mint/50",
      node: (
        <div className="w-full rounded-lg bg-ink p-1 pb-0">
          <MockQr seed="d6" className="aspect-square w-full overflow-hidden rounded-md" />
          <div className="py-1 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-white">Scan me</div>
        </div>
      ),
    },
  ];
  const tabs = ["Colours", "Dots", "Logo", "Frame"];
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-3">Create QR code / Design</div>
          <div className="truncate text-[15px] font-semibold tracking-[-0.01em]">Style your code</div>
        </div>
        <div className="hidden rounded-full bg-stone p-0.5 text-[11px] font-medium sm:flex">
          {tabs.map((t, i) => (
            <span key={t} className={`rounded-full px-2.5 py-1 ${i === 0 ? "bg-white shadow-card" : "text-muted-3"}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {samples.map((s, i) => (
          <div
            key={s.label}
            className={`rounded-xl p-1.5 ${i === 1 ? "ring-2 ring-ink" : "ring-1 ring-ink/[0.07]"}`}
          >
            <div className={`grid place-items-center rounded-lg p-2.5 sm:p-3 ${s.tile}`}>{s.node}</div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] font-medium">
              {s.label}
              {i === 1 && <Check className="h-3 w-3" strokeWidth={3} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
