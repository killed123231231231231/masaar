"use client";

import { FileText, Globe, Heart, Image as ImageIcon, MapPin, Play, Star } from "lucide-react";
import { BrandGlyph } from "@/components/icons/brand-icons";
import { platformMeta } from "../_lib/social-platforms";
import { type WizardType } from "../_lib/types";

/**
 * Static content-aware phone-shaped preview. Lives on the right of
 * Step 2. B5 (Step 2 reference match) — bigger device frame
 * (~280px wide instead of 224px) and a richer mocked-page body so it
 * reads like a real preview, not a wireframe.
 */
export default function PhonePreview({
  type,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form,
}: {
  type: WizardType | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: Record<string, any>;
}) {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="rounded-[2.25rem] border-[6px] border-ink bg-ink p-1 shadow-2xl shadow-ink/25">
        <div className="min-h-[440px] overflow-hidden rounded-[1.85rem] bg-white">
          {body(type, form)}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-3">
        How it looks when scanned
      </p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function body(type: WizardType | null, form: Record<string, any>) {
  switch (type) {
    case "url":
    case "app_link":
      return <UrlPreview url={form.url} />;
    case "vcard":
      return <VCardPreview form={form} />;
    case "text":
      return <SimplePreview title="Text" body={(form.text || "Your text appears here").slice(0, 200)} />;
    case "whatsapp":
      return <WhatsAppPreview form={form} />;
    case "wifi":
      return <SimplePreview title="Join Wi-Fi" body={`Network: ${form.ssid || "Your network"}`} />;
    case "email":
      return <SimplePreview title="New email" body={`To: ${form.to || "someone@example.com"}`} />;
    case "sms":
      return <SimplePreview title="New message" body={`To: ${form.number || "+966…"}`} />;
    case "phone":
      return <SimplePreview title="Call" body={form.number || "+966…"} />;
    case "social":
      return <SocialPreview form={form} />;
    case "location":
      return <LocationPreview form={form} />;
    case "feedback":
      return <FeedbackPreview form={form} />;
    case "pdf":
    case "image":
    case "video":
      return <FilePreview kind={type} form={form} />;
    default:
      return <SimplePreview title="Preview" body="Scan to open this content" />;
  }
}

function UrlPreview({ url }: { url?: string }) {
  const display = url && url.length > 2 ? url : "https://your-site.com";
  return (
    <>
      {/* Teal header bar with URL pill — matches the reference */}
      <div className="bg-lime px-3 pt-3 pb-4">
        <div className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 shadow-sm">
          <Globe className="h-3 w-3 shrink-0 text-muted-3" />
          <span className="truncate text-[10px] font-medium text-muted">{display}</span>
        </div>
      </div>

      {/* Skeleton headings */}
      <div className="space-y-1.5 px-3 pt-3">
        <div className="h-1 w-3/4 rounded-full bg-ink/10" />
        <div className="h-1 w-1/2 rounded-full bg-ink/10" />
      </div>

      {/* 2x2 image-card placeholders with heart icons */}
      <div className="px-3 pt-3 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <ImageCard />
          <ImageCard />
        </div>
      </div>

      {/* Bottom skeleton lines */}
      <div className="space-y-1.5 px-3">
        <div className="h-1 w-2/3 rounded-full bg-ink/10" />
        <div className="h-1 w-1/3 rounded-full bg-ink/10" />
      </div>

      <div className="px-3 pt-3 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <ImageCard />
          <ImageCard />
        </div>
      </div>
    </>
  );
}

function ImageCard() {
  return (
    <div className="relative aspect-[3/4] rounded-xl bg-stone/60">
      <Heart className="absolute right-1.5 top-1.5 h-3 w-3 fill-ink/55 text-muted-3" strokeWidth={0} />
      <div className="grid h-full place-items-center">
        <ImageGlyph />
      </div>
    </div>
  );
}

function ImageGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-muted-4" fill="currentColor" aria-hidden>
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.9 13.98l2.1 2.53 3.1-3.99c.2-.26.6-.26.8.01l3.51 4.68c.25.33.01.8-.4.8H5.02c-.41 0-.65-.47-.4-.8L8.1 13.98c.2-.26.6-.26.8 0z" />
    </svg>
  );
}

function VCardPreview({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: Record<string, any>;
}) {
  return (
    <>
      <div className="bg-lime px-3 pt-6 pb-4 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-white shadow-sm" />
        <p className="mt-3 font-heading text-sm font-bold text-ink">
          {(form.firstName || "First") + " " + (form.lastName || "Last")}
        </p>
        <p className="text-[11px] text-muted-2">{form.organization || "Company"}</p>
      </div>
      <div className="space-y-2 p-4">
        <Row label="Phone" value={form.phone || "-"} />
        <Row label="Email" value={form.email || "-"} />
        <Row label="Title" value={form.title || "-"} />
        <div className="mt-3 rounded-md bg-ink py-2 text-center text-xs font-semibold text-white">
          Save contact
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/5 pb-2 text-[10px] last:border-b-0">
      <span className="text-muted-3">{label}</span>
      <span className="truncate font-medium text-muted">{value}</span>
    </div>
  );
}

function WhatsAppPreview({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: Record<string, any>;
}) {
  const number = `${form.countryCode || "+966"}${form.number || " 5XXXXXXXX"}`;
  return (
    <>
      <div className="bg-[#075E54] px-4 pt-4 pb-3 text-white">
        <p className="text-[10px] opacity-75">Chat with</p>
        <p className="text-xs font-bold">{number}</p>
      </div>
      <div className="space-y-2 p-3">
        <div className="ml-auto max-w-[80%] rounded-xl bg-[#DCF8C6] px-2 py-1.5 text-[10px] text-muted">
          {form.message || "Hi there!"}
        </div>
      </div>
    </>
  );
}

function SimplePreview({ title, body }: { title: string; body: string }) {
  return (
    <>
      <div className="flex items-center justify-center bg-ink py-2 text-[11px] font-semibold text-white">
        {title}
      </div>
      <div className="p-4">
        <p className="text-xs text-muted">{body}</p>
      </div>
    </>
  );
}


/* Previews for the hosted types, so step 2 never shows an empty phone. */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SocialPreview({ form }: { form: Record<string, any> }) {
  const links: { platform: string; url: string }[] = Array.isArray(form.links) ? form.links : [];
  return (
    <div className="flex flex-col items-center px-4 pb-5 pt-7 text-center">
      <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-lime">
        {form.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <p className="mt-3 font-heading text-sm font-semibold text-ink">{form.display_name || "Your name"}</p>
      <p className="mt-1 line-clamp-2 text-[11px] text-muted-2">{form.bio || "A short line about you"}</p>
      <div className="mt-4 w-full space-y-2">
        {(links.length ? links : [{ platform: "instagram", url: "" }, { platform: "website", url: "" }]).slice(0, 5).map((l, i) => {
          const m = platformMeta(l.platform);
          return (
            <div key={`${l.platform}-${i}`} className="flex items-center gap-2 rounded-xl border border-stone-dark px-2.5 py-2 text-left">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg" style={{ background: m.color }}>
                <BrandGlyph platform={m.key} color="#FFFFFF" className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-semibold text-ink">{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LocationPreview({ form }: { form: Record<string, any> }) {
  return (
    <>
      <div className="relative h-56 bg-[linear-gradient(135deg,#F0EEEB_25%,#E7E4DF_25%,#E7E4DF_50%,#F0EEEB_50%,#F0EEEB_75%,#E7E4DF_75%)] bg-[length:28px_28px]">
        <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-full place-items-center rounded-full bg-ink text-lime shadow-card">
          <MapPin className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div className="p-4">
        <p className="font-heading text-sm font-semibold text-ink">{form.label || "Your location"}</p>
        <p className="mt-1 text-[11px] text-muted-2">Opens in Google Maps</p>
        <div className="mt-4 rounded-full bg-ink py-2 text-center text-[11px] font-semibold text-white">Get directions</div>
      </div>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FeedbackPreview({ form }: { form: Record<string, any> }) {
  return (
    <div className="flex flex-col items-center px-4 pb-5 pt-8 text-center">
      <p className="font-heading text-sm font-semibold text-ink">{form.headline || "How was your visit?"}</p>
      <p className="mt-1 text-[11px] text-muted-2">{form.prompt || "Tap a star to rate us"}</p>
      <div className="mt-4 flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className={`h-6 w-6 ${i < 4 ? "fill-lime text-ink" : "text-muted-4"}`} strokeWidth={1.6} aria-hidden />
        ))}
      </div>
      <div className="mt-5 h-16 w-full rounded-xl border border-stone-dark" />
      <div className="mt-3 w-full rounded-full bg-ink py-2 text-[11px] font-semibold text-white">Send feedback</div>
    </div>
  );
}

function FileIconFor({ kind }: { kind: "pdf" | "image" | "video" }) {
  const Icon = kind === "pdf" ? FileText : kind === "image" ? ImageIcon : Play;
  return <Icon className="h-7 w-7 text-ink" aria-hidden />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FilePreview({ kind, form }: { kind: "pdf" | "image" | "video"; form: Record<string, any> }) {
  const label = kind === "pdf" ? "PDF" : kind === "image" ? "Image" : "Video";
  return (
    <>
      <div className="flex items-center justify-center bg-ink py-2 text-[11px] font-semibold text-white">{label}</div>
      <div className="flex flex-col items-center p-5 text-center">
        <div className="grid h-40 w-full place-items-center rounded-xl bg-stone">
          {kind === "image" && form.asset_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.asset_url} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <FileIconFor kind={kind} />
          )}
        </div>
        <p className="mt-3 max-w-full truncate text-xs font-semibold text-ink">{form.asset_filename || `Your ${label.toLowerCase()}`}</p>
        <div className="mt-4 w-full rounded-full bg-ink py-2 text-[11px] font-semibold text-white">
          {kind === "pdf" ? "Open PDF" : kind === "image" ? "View image" : "Play video"}
        </div>
      </div>
    </>
  );
}
