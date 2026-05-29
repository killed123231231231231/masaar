"use client";

import {
  Globe, FileText, Image as ImageIcon, Contact, Video, Link2,
  MessageCircle, MessageSquare, Wifi, Mail, Phone, Type, MapPin,
  Star, UtensilsCrossed, Wallet, QrCode, type LucideIcon,
} from "lucide-react";
import { typeMeta, type WizardType } from "../_lib/types";
import PhonePreview from "./phone-preview";
import FileUpload from "./file-upload";
import SocialForm from "./social-form";
import LocationForm from "./location-form";

const ICONS: Record<string, LucideIcon> = {
  Globe, FileText, Image: ImageIcon, Contact, Video, Link2,
  MessageCircle, MessageSquare, Wifi, Mail, Phone, Type, MapPin,
  Star, UtensilsCrossed, Wallet,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Form = Record<string, any>;

// Per-type form copy. Heading is the type label; subtitle is a short
// instruction that lands under the icon chip in the form-card header
// (matches the design-targets/wizard-step2-v2.png reference).
const FORM_COPY: Partial<Record<WizardType, { subtitle: string }>> = {
  url: { subtitle: "Enter the website URL for your QR code and give a memorable name" },
  text: { subtitle: "Type or paste the text people will see when they scan" },
  vcard: { subtitle: "Fill in the contact details people will save when they scan" },
  wifi: { subtitle: "Enter your network details — scanners will join in one tap" },
  email: { subtitle: "Pre-fill the recipient, subject, and body for a one-tap email" },
  sms: { subtitle: "Pre-fill the phone number and message for a one-tap text" },
  phone: { subtitle: "Enter the phone number people will call when they scan" },
  whatsapp: { subtitle: "Open a WhatsApp chat with a pre-filled message" },
  app_link: { subtitle: "Send scanners to your app on the right store automatically" },
  pdf: { subtitle: "Upload a PDF — scanners open it on a clean hosted page" },
  image: { subtitle: "Upload an image — scanners see it full-screen" },
  video: { subtitle: "Upload a video — it plays right after the scan" },
};

export default function Step2Content({
  type,
  form,
  setForm,
  name,
  setName,
  draftToken,
}: {
  type: WizardType;
  form: Form;
  setForm: (f: Form) => void;
  name: string;
  setName: (n: string) => void;
  /** C — passed through to the file-upload component for anon uploads. */
  draftToken: string;
}) {
  const set = (k: string, v: unknown) => setForm({ ...form, [k]: v });
  const meta = typeMeta(type);
  const HeaderIcon = ICONS[meta.icon] ?? QrCode;
  const subtitle =
    FORM_COPY[type]?.subtitle ??
    "Fill in the content for this QR code and give it a memorable name.";

  return (
    <div className="grid gap-8 pt-6 lg:grid-cols-[1fr_360px] lg:gap-10 lg:pt-10">
      {/* LEFT — form card with icon-chip header per the reference. */}
      <section className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-[0_1px_2px_rgba(15,91,85,0.04)] sm:p-8">
        <header className="flex items-start gap-4 border-b border-charcoal/10 pb-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-deep-teal/10 text-deep-teal">
            <HeaderIcon className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
              {meta.label}
            </h1>
            <p className="mt-1 text-sm text-charcoal/55">{subtitle}</p>
          </div>
        </header>

        <div className="mt-6 space-y-5">
          {type === "url" && (
            <Field label="Enter your website" required>
              <input
                value={form.url ?? "https://"}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://example.com"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-charcoal/45">
                No “https://”? We’ll add it for you.
              </p>
            </Field>
          )}

          {type === "text" && (
            <Field label="Text" required>
              <textarea
                value={form.text ?? ""}
                onChange={(e) => set("text", e.target.value)}
                rows={4}
                maxLength={1000}
                className={inputCls}
                placeholder="Anything up to 1000 characters"
              />
            </Field>
          )}

          {type === "vcard" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name"><input value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} className={inputCls} /></Field>
              <Field label="Last name"><input value={form.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} className={inputCls} /></Field>
              <Field label="Phone"><input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={inputCls} /></Field>
              <Field label="Email"><input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} className={inputCls} /></Field>
              <Field label="Company"><input value={form.organization ?? ""} onChange={(e) => set("organization", e.target.value)} className={inputCls} /></Field>
              <Field label="Job title"><input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} className={inputCls} /></Field>
              <div className="col-span-2">
                <Field label="Website"><input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://example.com" className={inputCls} /></Field>
              </div>
              <div className="col-span-2">
                <Field label="Address"><input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} className={inputCls} /></Field>
              </div>
            </div>
          )}

          {type === "wifi" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Network name (SSID)" required><input value={form.ssid ?? ""} onChange={(e) => set("ssid", e.target.value)} className={inputCls} /></Field>
              </div>
              <Field label="Password"><input value={form.password ?? ""} onChange={(e) => set("password", e.target.value)} className={inputCls} /></Field>
              <Field label="Encryption">
                <select value={form.encryption ?? "WPA"} onChange={(e) => set("encryption", e.target.value)} className={inputCls}>
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None</option>
                </select>
              </Field>
              <label className="col-span-2 flex items-center gap-2 text-sm text-charcoal/70">
                <input type="checkbox" checked={!!form.hidden} onChange={(e) => set("hidden", e.target.checked)} />
                Hidden network
              </label>
            </div>
          )}

          {type === "email" && (
            <div className="space-y-4">
              <Field label="To" required><input value={form.to ?? ""} onChange={(e) => set("to", e.target.value)} placeholder="hello@example.com" className={inputCls} /></Field>
              <Field label="Subject"><input value={form.subject ?? ""} onChange={(e) => set("subject", e.target.value)} className={inputCls} /></Field>
              <Field label="Body"><textarea value={form.body ?? ""} onChange={(e) => set("body", e.target.value)} rows={3} className={inputCls} /></Field>
            </div>
          )}

          {type === "sms" && (
            <div className="space-y-4">
              <Field label="Phone number" required><input value={form.number ?? ""} onChange={(e) => set("number", e.target.value)} placeholder="+9665XXXXXXXX" className={inputCls} /></Field>
              <Field label="Message"><textarea value={form.message ?? ""} onChange={(e) => set("message", e.target.value)} rows={3} className={inputCls} /></Field>
            </div>
          )}

          {type === "phone" && (
            <Field label="Phone number" required>
              <input value={form.number ?? ""} onChange={(e) => set("number", e.target.value)} placeholder="+9665XXXXXXXX" className={inputCls} />
            </Field>
          )}

          {type === "whatsapp" && (
            <div className="space-y-4">
              <div className="grid grid-cols-[110px_1fr] gap-3">
                <Field label="Code">
                  <select value={form.countryCode ?? "+966"} onChange={(e) => set("countryCode", e.target.value)} className={inputCls}>
                    {["+966", "+971", "+974", "+973", "+965", "+968"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="WhatsApp number" required>
                  <input value={form.number ?? ""} onChange={(e) => set("number", e.target.value)} placeholder="5XXXXXXXX" className={inputCls} />
                </Field>
              </div>
              <Field label="Pre-filled message (optional)">
                <textarea value={form.message ?? ""} onChange={(e) => set("message", e.target.value)} rows={3} className={inputCls} />
              </Field>
            </div>
          )}

          {type === "app_link" && (
            <div className="space-y-4">
              <Field label="App name" required><input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="My App" className={inputCls} /></Field>
              <Field label="App URL (App Store / Play Store)" required><input value={form.url ?? "https://"} onChange={(e) => set("url", e.target.value)} placeholder="https://apps.apple.com/..." className={inputCls} /></Field>
              <Field label="Fallback URL (desktop, optional)"><input value={form.fallback ?? ""} onChange={(e) => set("fallback", e.target.value)} className={inputCls} /></Field>
            </div>
          )}

          {type === "social" && (
            <SocialForm form={form} setForm={setForm} draftToken={draftToken} />
          )}

          {type === "location" && <LocationForm form={form} setForm={setForm} />}

          {(type === "pdf" || type === "image" || type === "video") && (
            <FileUpload
              kind={type}
              form={form}
              setForm={setForm}
              draftToken={draftToken}
            />
          )}

          {!meta.ready && (
            <div className="rounded-xl border border-charcoal/10 bg-sand-light/50 p-6 text-sm text-charcoal/60">
              The <strong>{meta.label}</strong> form lands in a later
              session (its backend isn’t live yet). Pick a ready type to
              go end-to-end now.
            </div>
          )}

          <Field label="Name your QR Code">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="My QR code"
            />
          </Field>
        </div>
      </section>

      {/* RIGHT — phone preview, bigger and more prominent per the
          reference. Sticky so the user sees their input live. */}
      <aside className="self-start lg:sticky lg:top-28">
        <PhonePreview type={type} form={form} />
      </aside>
    </div>
  );
}

// Inputs match the reference: light bg, slightly taller, info icon
// on the right (decorative — wired to a tooltip in a future polish).
const inputCls =
  "block w-full rounded-lg border border-charcoal/15 bg-sand-light/30 px-4 py-3 text-sm text-charcoal outline-none transition-colors placeholder:text-charcoal/40 focus:border-deep-teal focus:bg-white focus:ring-2 focus:ring-deep-teal/15";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-charcoal/80">
        {label}
        {required && <span className="ml-0.5 text-terracotta">*</span>}
      </span>
      {children}
    </label>
  );
}
