"use client";

import { typeMeta, type WizardType } from "../_lib/types";
import PhonePreview from "./phone-preview";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Form = Record<string, any>;

export default function Step2Content({
  type,
  form,
  setForm,
  name,
  setName,
}: {
  type: WizardType;
  form: Form;
  setForm: (f: Form) => void;
  name: string;
  setName: (n: string) => void;
}) {
  const set = (k: string, v: unknown) => setForm({ ...form, [k]: v });
  const meta = typeMeta(type);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-charcoal">
          Complete content
        </h1>
        <p className="mt-1 text-sm text-charcoal/60">{meta.desc}</p>

        <div className="mt-6 space-y-4">
          {type === "url" && (
            <Field label="Destination URL">
              <input
                value={form.url ?? "https://"}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://example.com"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-charcoal/45">
                No “https://”? We’ll add it for you.
              </p>
            </Field>
          )}

          {type === "text" && (
            <Field label="Text">
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <input value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Last name">
                <input value={form.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Email">
                <input value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Company">
                <input value={form.organization ?? ""} onChange={(e) => set("organization", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Job title">
                <input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Website">
                  <input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://example.com" className={inputCls} />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="Address">
                  <input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>
          )}

          {type === "wifi" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Network name (SSID)">
                  <input value={form.ssid ?? ""} onChange={(e) => set("ssid", e.target.value)} className={inputCls} />
                </Field>
              </div>
              <Field label="Password">
                <input value={form.password ?? ""} onChange={(e) => set("password", e.target.value)} className={inputCls} />
              </Field>
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
              <Field label="To"><input value={form.to ?? ""} onChange={(e) => set("to", e.target.value)} placeholder="hello@example.com" className={inputCls} /></Field>
              <Field label="Subject"><input value={form.subject ?? ""} onChange={(e) => set("subject", e.target.value)} className={inputCls} /></Field>
              <Field label="Body"><textarea value={form.body ?? ""} onChange={(e) => set("body", e.target.value)} rows={3} className={inputCls} /></Field>
            </div>
          )}

          {type === "sms" && (
            <div className="space-y-4">
              <Field label="Phone number"><input value={form.number ?? ""} onChange={(e) => set("number", e.target.value)} placeholder="+9665XXXXXXXX" className={inputCls} /></Field>
              <Field label="Message"><textarea value={form.message ?? ""} onChange={(e) => set("message", e.target.value)} rows={3} className={inputCls} /></Field>
            </div>
          )}

          {type === "phone" && (
            <Field label="Phone number">
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
                <Field label="WhatsApp number">
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
              <Field label="App name"><input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="My App" className={inputCls} /></Field>
              <Field label="App URL (App Store / Play Store)"><input value={form.url ?? "https://"} onChange={(e) => set("url", e.target.value)} placeholder="https://apps.apple.com/..." className={inputCls} /></Field>
              <Field label="Fallback URL (desktop, optional)"><input value={form.fallback ?? ""} onChange={(e) => set("fallback", e.target.value)} className={inputCls} /></Field>
            </div>
          )}

          {!meta.ready && (
            <div className="rounded-xl border border-charcoal/10 bg-sand-light/50 p-6 text-sm text-charcoal/60">
              The <strong>{meta.label}</strong> form lands in a later
              session (its backend isn’t live yet). Pick a ready type to
              go end-to-end now.
            </div>
          )}

          <Field label="Name your QR code">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="My QR code"
            />
          </Field>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <PhonePreview type={type} form={form} />
      </aside>
    </div>
  );
}

const inputCls =
  "block w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm outline-none focus:border-deep-teal focus:ring-2 focus:ring-deep-teal/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-charcoal/75">
        {label}
      </span>
      {children}
    </label>
  );
}
