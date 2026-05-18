"use client";

import { typeMeta, type WizardType } from "../_lib/types";

// Static, content-aware reassurance mock (not a live iframe). Basic per
// spec — Session B's visual pass may refine these.
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
    <div className="mx-auto w-56">
      <div className="rounded-[2rem] border-[6px] border-charcoal bg-charcoal p-1 shadow-2xl shadow-charcoal/20">
        <div className="min-h-[360px] overflow-hidden rounded-[1.6rem] bg-white">
          <div className="flex items-center justify-center bg-deep-teal py-2 text-[11px] font-semibold text-white">
            {type ? typeMeta(type).label : "Preview"}
          </div>
          <div className="space-y-3 p-4 text-center">
            {body(type, form)}
          </div>
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
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border border-charcoal/10 bg-sand-light/50 p-4 text-sm text-charcoal/70">
      {children}
    </div>
  );

  switch (type) {
    case "url":
    case "app_link":
      return (
        <>
          <div className="flex items-center gap-1 rounded-md border border-charcoal/10 px-2 py-1 text-[11px] text-charcoal/50">
            <span className="h-2 w-2 rounded-full bg-deep-teal/40" />
            {domain(form.url) || "your-site.com"}
          </div>
          <Card>Opens the website / app link</Card>
        </>
      );
    case "vcard":
      return (
        <Card>
          <p className="font-semibold text-charcoal">
            {(form.firstName || "First") + " " + (form.lastName || "Last")}
          </p>
          <p className="mt-1 text-xs">{form.organization || "Company"}</p>
          <p className="mt-3 rounded-md bg-deep-teal py-1.5 text-xs font-semibold text-white">
            Save contact
          </p>
        </Card>
      );
    case "text":
      return (
        <Card>{(form.text || "Your text appears here").slice(0, 120)}</Card>
      );
    case "whatsapp":
      return (
        <Card>
          <p className="text-xs">Chat with {form.countryCode || "+966"}{form.number || "…"}</p>
          <p className="mt-2 rounded-lg bg-[#25D366]/15 p-2 text-left text-xs">
            {form.message || "Hi! 👋"}
          </p>
        </Card>
      );
    case "wifi":
      return <Card>Join “{form.ssid || "Network"}”?</Card>;
    case "email":
      return <Card>New email to {form.to || "someone@example.com"}</Card>;
    case "sms":
      return <Card>Message to {form.number || "+966…"}</Card>;
    case "phone":
      return <Card>Call {form.number || "+966…"}?</Card>;
    default:
      return <Card>Scan to open this content</Card>;
  }
}

function domain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).host;
  } catch {
    return null;
  }
}
