"use client";

import { useMemo, useState } from "react";
import QrPreview from "@/components/qr-preview";
import { encodeEmail, encodePhone, encodeSms, encodeVCard, encodeWifi } from "@/lib/content-types";
import type { ContentKind, QrKind } from "@/types/database";
import { appUrl } from "@/lib/utils";

interface Props {
  initialShortId?: string | null;   // for dynamic preview
  onSave: (payload: SavePayload) => Promise<void>;
  saving?: boolean;
}

export interface SavePayload {
  name: string;
  kind: QrKind;
  content_kind: ContentKind;
  destination: string;
  payload_json: Record<string, unknown> | null;
  fg_color: string;
  bg_color: string;
  gradient_color: string | null;
  dot_style: string;
  corner_style: string;
}

const CONTENT_TABS: { key: ContentKind; label: string }[] = [
  { key: "url",   label: "URL" },
  { key: "text",  label: "Text" },
  { key: "vcard", label: "vCard" },
  { key: "wifi",  label: "WiFi" },
  { key: "email", label: "Email" },
  { key: "sms",   label: "SMS" },
  { key: "phone", label: "Phone" },
];

const DOT_STYLES = ["square", "dots", "rounded", "classy", "classy-rounded", "extra-rounded"];
const CORNER_STYLES = ["square", "dot", "extra-rounded"];

export default function QrCustomizer({ initialShortId, onSave, saving }: Props) {
  const [name, setName] = useState("Untitled QR");
  const [kind, setKind] = useState<QrKind>("dynamic");
  const [content_kind, setContentKind] = useState<ContentKind>("url");

  // URL/text raw value
  const [urlValue, setUrlValue] = useState("https://");
  const [textValue, setTextValue] = useState("");

  // Structured payloads
  const [vcard, setVcard] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [wifi, setWifi] = useState({ ssid: "", password: "", encryption: "WPA" as "WPA" | "WEP" | "nopass" });
  const [email, setEmail] = useState({ to: "", subject: "", body: "" });
  const [sms, setSms] = useState({ number: "", message: "" });
  const [phone, setPhone] = useState("");

  // Styling
  const [fgColor, setFgColor] = useState("#0070cc");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [gradient, setGradient] = useState<string | null>(null);
  const [dotStyle, setDotStyle] = useState("rounded");
  const [cornerStyle, setCornerStyle] = useState("extra-rounded");

  // Compute destination (the raw string that the QR encodes)
  const rawDestination = useMemo(() => {
    switch (content_kind) {
      case "url":   return urlValue;
      case "text":  return textValue;
      case "vcard": return encodeVCard(vcard);
      case "wifi":  return encodeWifi(wifi);
      case "email": return encodeEmail(email);
      case "sms":   return encodeSms(sms);
      case "phone": return encodePhone(phone);
    }
  }, [content_kind, urlValue, textValue, vcard, wifi, email, sms, phone]);

  // For dynamic URL QRs, the embedded value is the Masaar short link.
  // For static QRs, the embedded value is the raw destination itself.
  const previewData = useMemo(() => {
    if (kind === "dynamic" && content_kind === "url" && initialShortId) {
      return `${appUrl()}/r/${initialShortId}`;
    }
    return rawDestination || " ";
  }, [kind, content_kind, initialShortId, rawDestination]);

  // What we persist as the destination field.
  // For dynamic URL QRs we store the real destination (server adds short_id separately).
  const persistedDestination = rawDestination;

  // Structured payload to store alongside (for re-editing vCard etc.)
  const payloadJson = useMemo(() => {
    switch (content_kind) {
      case "vcard": return vcard;
      case "wifi":  return wifi;
      case "email": return email;
      case "sms":   return sms;
      case "phone": return { number: phone };
      default:      return null;
    }
  }, [content_kind, vcard, wifi, email, sms, phone]);

  async function handleSave() {
    await onSave({
      name,
      kind,
      content_kind,
      destination: persistedDestination,
      payload_json: payloadJson,
      fg_color: fgColor,
      bg_color: bgColor,
      gradient_color: gradient,
      dot_style: dotStyle,
      corner_style: cornerStyle,
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* LEFT — form */}
      <div className="space-y-6">
        {/* Name */}
        <Section title="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Give this QR a name"
          />
        </Section>

        {/* Kind */}
        <Section title="Type">
          <div className="grid grid-cols-2 gap-3">
            <KindCard
              active={kind === "dynamic"}
              title="Dynamic"
              body="Editable destination, tracked scans. Requires URL content."
              onClick={() => setKind("dynamic")}
            />
            <KindCard
              active={kind === "static"}
              title="Static"
              body="Embeds data directly. No tracking, can't be changed after print."
              onClick={() => setKind("static")}
            />
          </div>
        </Section>

        {/* Content tabs */}
        <Section title="Content">
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_TABS.map((t) => (
              <button
                key={t.key}
                disabled={kind === "dynamic" && t.key !== "url"}
                onClick={() => setContentKind(t.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${
                  content_kind === t.key
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {kind === "dynamic" && (
            <p className="mt-2 text-xs text-gray-500">
              Dynamic QRs only support URL destinations (they route through your Masaar link).
            </p>
          )}

          <div className="mt-4 space-y-3">
            {content_kind === "url" && (
              <Input label="Destination URL" value={urlValue} onChange={setUrlValue} placeholder="https://example.com" />
            )}
            {content_kind === "text" && (
              <Textarea label="Text" value={textValue} onChange={setTextValue} />
            )}
            {content_kind === "vcard" && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="First name" value={vcard.firstName} onChange={(v) => setVcard({ ...vcard, firstName: v })} />
                <Input label="Last name" value={vcard.lastName} onChange={(v) => setVcard({ ...vcard, lastName: v })} />
                <Input label="Phone" value={vcard.phone} onChange={(v) => setVcard({ ...vcard, phone: v })} />
                <Input label="Email" value={vcard.email} onChange={(v) => setVcard({ ...vcard, email: v })} />
              </div>
            )}
            {content_kind === "wifi" && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Network (SSID)" value={wifi.ssid} onChange={(v) => setWifi({ ...wifi, ssid: v })} />
                <Input label="Password" value={wifi.password} onChange={(v) => setWifi({ ...wifi, password: v })} />
                <label className="block col-span-2">
                  <span className="block text-sm font-medium text-gray-700">Encryption</span>
                  <select
                    value={wifi.encryption}
                    onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as typeof wifi.encryption })}
                    className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="WPA">WPA / WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">No password</option>
                  </select>
                </label>
              </div>
            )}
            {content_kind === "email" && (
              <div className="space-y-3">
                <Input label="To" value={email.to} onChange={(v) => setEmail({ ...email, to: v })} placeholder="hello@example.com" />
                <Input label="Subject" value={email.subject} onChange={(v) => setEmail({ ...email, subject: v })} />
                <Textarea label="Body" value={email.body} onChange={(v) => setEmail({ ...email, body: v })} />
              </div>
            )}
            {content_kind === "sms" && (
              <div className="space-y-3">
                <Input label="Phone" value={sms.number} onChange={(v) => setSms({ ...sms, number: v })} placeholder="+9665XXXXXXXX" />
                <Textarea label="Message" value={sms.message} onChange={(v) => setSms({ ...sms, message: v })} />
              </div>
            )}
            {content_kind === "phone" && (
              <Input label="Phone number" value={phone} onChange={setPhone} placeholder="+9665XXXXXXXX" />
            )}
          </div>
        </Section>

        {/* Styling */}
        <Section title="Style">
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Foreground" value={fgColor} onChange={setFgColor} />
            <ColorField label="Background" value={bgColor} onChange={setBgColor} />
            <ColorField
              label="Gradient (optional)"
              value={gradient ?? "#000000"}
              onChange={(v) => setGradient(v)}
              clearable={!!gradient}
              onClear={() => setGradient(null)}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Select label="Dot style" value={dotStyle} onChange={setDotStyle} options={DOT_STYLES} />
            <Select label="Corner style" value={cornerStyle} onChange={setCornerStyle} options={CORNER_STYLES} />
          </div>
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save QR code"}
        </button>
      </div>

      {/* RIGHT — preview */}
      <aside className="lg:sticky lg:top-8 self-start">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <QrPreview
            style={{
              data: previewData,
              fgColor,
              bgColor,
              gradientColor: gradient,
              dotStyle,
              cornerStyle,
            }}
          />
          {kind === "dynamic" && (
            <p className="mt-4 text-center text-xs text-gray-500">
              Embeds <code className="text-brand-600">/r/{initialShortId ?? "…"}</code> · destination editable anytime
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Input({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
    </label>
  );
}

function Textarea({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
    </label>
  );
}

function ColorField({
  label, value, onChange, clearable, onClear,
}: { label: string; value: string; onChange: (v: string) => void; clearable?: boolean; onClear?: () => void }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-gray-700">
        <span>{label}</span>
        {clearable && (
          <button type="button" onClick={onClear} className="text-xs text-gray-400 hover:text-gray-700">
            Clear
          </button>
        )}
      </span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded border border-gray-200"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-mono"
        />
      </div>
    </label>
  );
}

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o.replace(/-/g, " ")}</option>
        ))}
      </select>
    </label>
  );
}

function KindCard({
  active, title, body, onClick,
}: { active: boolean; title: string; body: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition ${
        active
          ? "border-brand-500 bg-brand-50/40 ring-2 ring-brand-100"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="mt-1 text-xs text-gray-500">{body}</p>
    </button>
  );
}
