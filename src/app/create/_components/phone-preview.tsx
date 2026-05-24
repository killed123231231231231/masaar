"use client";

import { Globe, Heart } from "lucide-react";
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
      <div className="rounded-[2.25rem] border-[6px] border-charcoal bg-charcoal p-1 shadow-2xl shadow-charcoal/25">
        <div className="min-h-[440px] overflow-hidden rounded-[1.85rem] bg-white">
          {body(type, form)}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-charcoal/45">
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
    default:
      return <SimplePreview title="Preview" body="Scan to open this content" />;
  }
}

function UrlPreview({ url }: { url?: string }) {
  const display = url && url.length > 2 ? url : "https://your-site.com";
  return (
    <>
      {/* Teal header bar with URL pill — matches the reference */}
      <div className="bg-deep-teal/35 px-3 pt-3 pb-4">
        <div className="flex items-center gap-2 rounded-md bg-white px-2.5 py-1.5 shadow-sm">
          <Globe className="h-3 w-3 shrink-0 text-charcoal/55" />
          <span className="truncate text-[10px] font-medium text-charcoal/75">{display}</span>
        </div>
      </div>

      {/* Skeleton headings */}
      <div className="space-y-1.5 px-3 pt-3">
        <div className="h-1 w-3/4 rounded-full bg-charcoal/10" />
        <div className="h-1 w-1/2 rounded-full bg-charcoal/10" />
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
        <div className="h-1 w-2/3 rounded-full bg-charcoal/10" />
        <div className="h-1 w-1/3 rounded-full bg-charcoal/10" />
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
    <div className="relative aspect-[3/4] rounded-lg bg-sand-light/80">
      <Heart className="absolute right-1.5 top-1.5 h-3 w-3 fill-deep-teal/55 text-deep-teal/55" strokeWidth={0} />
      <div className="grid h-full place-items-center">
        <ImageGlyph />
      </div>
    </div>
  );
}

function ImageGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-charcoal/25" fill="currentColor" aria-hidden>
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
      <div className="bg-deep-teal/35 px-3 pt-6 pb-4 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-white shadow-sm" />
        <p className="mt-3 font-display text-sm font-bold text-charcoal">
          {(form.firstName || "First") + " " + (form.lastName || "Last")}
        </p>
        <p className="text-[11px] text-charcoal/65">{form.organization || "Company"}</p>
      </div>
      <div className="space-y-2 p-4">
        <Row label="Phone" value={form.phone || "—"} />
        <Row label="Email" value={form.email || "—"} />
        <Row label="Title" value={form.title || "—"} />
        <div className="mt-3 rounded-md bg-deep-teal py-2 text-center text-xs font-semibold text-white">
          Save contact
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-charcoal/5 pb-2 text-[10px] last:border-b-0">
      <span className="text-charcoal/45">{label}</span>
      <span className="truncate font-medium text-charcoal/80">{value}</span>
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
        <div className="ml-auto max-w-[80%] rounded-lg bg-[#DCF8C6] px-2 py-1.5 text-[10px] text-charcoal/80">
          {form.message || "Hi! 👋"}
        </div>
      </div>
    </>
  );
}

function SimplePreview({ title, body }: { title: string; body: string }) {
  return (
    <>
      <div className="flex items-center justify-center bg-deep-teal py-2 text-[11px] font-semibold text-white">
        {title}
      </div>
      <div className="p-4">
        <p className="text-xs text-charcoal/70">{body}</p>
      </div>
    </>
  );
}

