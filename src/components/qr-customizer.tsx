"use client";

import { useEffect, useMemo, useState } from "react";
import QrPreview from "@/components/qr-preview";
import { encodeEmail, encodePhone, encodeSms, encodeVCard, encodeWifi, encodeWhatsapp, encodeAppLink } from "@/lib/content-types";
import { normalizeUrl } from "@/lib/url";
import type { ContentKind, QrKind } from "@/types/database";
import { appUrl } from "@/lib/utils";
import { generateShortId } from "@/lib/shortid";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initialShortId?: string | null;   // for dynamic preview
  onSave: (payload: SavePayload) => Promise<void>;
  saving?: boolean;
  // Logo upload writes to the owner-scoped `logos` bucket
  // (auth.uid() = folder[1]); anon can't upload, so the control is
  // only shown when the caller says the user is authenticated.
  allowLogo?: boolean;
}

export interface SavePayload {
  name: string;
  kind: QrKind;
  content_kind: ContentKind;
  short_id: string;
  destination: string;
  payload_json: Record<string, unknown> | null;
  fg_color: string;
  bg_color: string;
  gradient_color: string | null;
  dot_style: string;
  corner_style: string;
  logo_url: string | null;
}

const CONTENT_TABS: { key: ContentKind; label: string }[] = [
  { key: "url",   label: "URL" },
  { key: "text",  label: "Text" },
  { key: "vcard", label: "vCard" },
  { key: "wifi",  label: "WiFi" },
  { key: "email", label: "Email" },
  { key: "sms",   label: "SMS" },
  { key: "phone", label: "Phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "app_link", label: "App Link" },
];

const DOT_STYLES = ["square", "dots", "rounded", "classy", "classy-rounded", "extra-rounded"];
const CORNER_STYLES = ["square", "dot", "extra-rounded"];

// Content types that produce a URL and so can route through /r/ (dynamic,
// trackable, editable). Everything else encodes its payload directly and
// is inherently static.
const DYNAMIC_CAPABLE: ContentKind[] = ["url", "whatsapp", "app_link"];

const WA_COUNTRY_CODES = ["+966", "+971", "+974", "+973", "+965", "+968"];

export default function QrCustomizer({ initialShortId, onSave, saving, allowLogo }: Props) {
  // Generate the shortId once, client-side, so the QR the user previews
  // and downloads encodes the SAME /r/<shortId> the server will persist.
  const [shortId] = useState(() => initialShortId ?? generateShortId());
  const [name, setName] = useState("Untitled QR");
  const [kind, setKind] = useState<QrKind>("dynamic");
  const [content_kind, setContentKind] = useState<ContentKind>("url");

  // URL/text raw value
  const [urlValue, setUrlValue] = useState("https://");
  const [textValue, setTextValue] = useState("");

  // Structured payloads
  const [vcard, setVcard] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    organization: "",
    title: "",
    website: "",
    address: "",
  });
  const [wifi, setWifi] = useState({ ssid: "", password: "", encryption: "WPA" as "WPA" | "WEP" | "nopass" });
  const [email, setEmail] = useState({ to: "", subject: "", body: "" });
  const [sms, setSms] = useState({ number: "", message: "" });
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState({
    countryCode: "+966",
    number: "",
    message: "",
  });
  const [appLink, setAppLink] = useState({
    name: "",
    url: "https://",
    fallback: "",
  });

  // Styling
  const [fgColor, setFgColor] = useState("#0070cc");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [gradient, setGradient] = useState<string | null>(null);
  const [dotStyle, setDotStyle] = useState("rounded");
  const [cornerStyle, setCornerStyle] = useState("extra-rounded");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoErr, setLogoErr] = useState<string | null>(null);

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
      case "whatsapp":
        return encodeWhatsapp({
          phone: whatsapp.countryCode + whatsapp.number,
          message: whatsapp.message,
        });
      case "app_link":
        return encodeAppLink(appLink);
      default:
        // pdf/image/video are created via the /create wizard's upload
        // form, not this legacy customizer — keep the memo a plain string.
        return "";
    }
  }, [content_kind, urlValue, textValue, vcard, wifi, email, sms, phone, whatsapp, appLink]);

  // For dynamic URL QRs, the embedded value is the Masaar short link.
  // For static QRs, the embedded value is the raw destination itself.
  const previewData = useMemo(() => {
    // Any dynamic QR encodes the Masaar short link (that's the point of
    // dynamic — the printed code never changes).
    if (kind === "dynamic") {
      return `${appUrl()}/r/${shortId}`;
    }
    return rawDestination || " ";
  }, [kind, shortId, rawDestination]);

  // What we persist as the destination field.
  // For dynamic URL QRs we store the real destination (server adds short_id
  // separately). A bare "karakexpress.com" is normalized to
  // "https://karakexpress.com" so it passes parseHttpUrl on save.
  const persistedDestination = DYNAMIC_CAPABLE.includes(content_kind)
    ? normalizeUrl(rawDestination)
    : rawDestination;

  // Structured payload to store alongside (for re-editing vCard etc.)
  const payloadJson = useMemo(() => {
    switch (content_kind) {
      case "vcard": return vcard;
      case "wifi":  return wifi;
      case "email": return email;
      case "sms":   return sms;
      case "phone": return { number: phone };
      case "whatsapp": return whatsapp;
      case "app_link": return appLink;
      default:      return null;
    }
  }, [content_kind, vcard, wifi, email, sms, phone, whatsapp, appLink]);

  // Non-URL content types encode their payload directly into the QR —
  // there's nothing to redirect, so they're inherently STATIC. Picking
  // one auto-switches kind so the tabs aren't dead-ends behind the
  // dynamic default (the "only URL is exposed" report).
  function selectContent(k: ContentKind) {
    setContentKind(k);
    if (!DYNAMIC_CAPABLE.includes(k)) setKind("static");
  }

  async function handleLogo(file: File) {
    setLogoErr(null);
    const okType = ["image/png", "image/jpeg", "image/svg+xml"].includes(
      file.type
    );
    if (!okType) {
      setLogoErr("PNG, JPG or SVG only.");
      return;
    }
    if (file.size > 500 * 1024) {
      setLogoErr("Logo must be under 500 KB.");
      return;
    }
    setLogoBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLogoErr("Sign in to upload a logo.");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      // Path must start with the uploader's auth.uid() — the
      // logos_owner_upload storage policy checks foldername[1].
      const path = `${user.id}/${shortId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        setLogoErr(upErr.message);
        return;
      }
      const { data } = supabase.storage.from("logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    } finally {
      setLogoBusy(false);
    }
  }

  async function handleSave() {
    await onSave({
      name,
      kind,
      content_kind,
      short_id: shortId,
      destination: persistedDestination,
      payload_json: payloadJson,
      fg_color: fgColor,
      bg_color: bgColor,
      gradient_color: gradient,
      dot_style: dotStyle,
      corner_style: cornerStyle,
      logo_url: logoUrl,
    });
  }

  // Bug 8: rebuilding the QR on every keystroke flashes the preview.
  // Memoize the live style, then debounce by 300ms so qr-code-styling
  // re-renders once typing settles, not per character.
  const liveStyle = useMemo(
    () => ({
      data: previewData,
      fgColor,
      bgColor,
      gradientColor: gradient,
      dotStyle,
      cornerStyle,
      logoUrl,
    }),
    [previewData, fgColor, bgColor, gradient, dotStyle, cornerStyle, logoUrl]
  );
  const previewStyle = useDebouncedValue(liveStyle, 300);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* LEFT — form */}
      <div className="space-y-6">
        {/* Name */}
        <Section title="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm transition-colors duration-150 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/20"
            placeholder="Give this QR a name"
          />
        </Section>

        {/* Kind */}
        <Section title="Type">
          <div className="grid grid-cols-2 gap-3">
            <KindCard
              active={kind === "dynamic"}
              disabled={!DYNAMIC_CAPABLE.includes(content_kind)}
              title="Dynamic"
              body="Editable destination, tracked scans. URL content only."
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
                onClick={() => selectContent(t.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  content_kind === t.key
                    ? "bg-deep-teal text-white"
                    : "bg-sand-light text-charcoal/75 hover:bg-sand"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-charcoal/55">
            {DYNAMIC_CAPABLE.includes(content_kind)
              ? "Routes through your Masaar link — can be dynamic (editable, tracked) or static."
              : `${CONTENT_TABS.find((t) => t.key === content_kind)?.label} is encoded directly into the QR — it's a static code (no redirect or tracking).`}
          </p>

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
                <Input label="Company" value={vcard.organization} onChange={(v) => setVcard({ ...vcard, organization: v })} />
                <Input label="Job title" value={vcard.title} onChange={(v) => setVcard({ ...vcard, title: v })} />
                <div className="col-span-2">
                  <Input label="Website" value={vcard.website} onChange={(v) => setVcard({ ...vcard, website: v })} placeholder="https://example.com" />
                </div>
                <div className="col-span-2">
                  <Input label="Address" value={vcard.address} onChange={(v) => setVcard({ ...vcard, address: v })} />
                </div>
              </div>
            )}
            {content_kind === "wifi" && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Network (SSID)" value={wifi.ssid} onChange={(v) => setWifi({ ...wifi, ssid: v })} />
                <Input label="Password" value={wifi.password} onChange={(v) => setWifi({ ...wifi, password: v })} />
                <label className="block col-span-2">
                  <span className="block text-sm font-medium text-charcoal/75">Encryption</span>
                  <select
                    value={wifi.encryption}
                    onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as typeof wifi.encryption })}
                    className="mt-1 block w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm transition-colors duration-150 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/20"
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
            {content_kind === "whatsapp" && (
              <div className="space-y-3">
                <div className="grid grid-cols-[110px_1fr] gap-3">
                  <Select
                    label="Code"
                    value={whatsapp.countryCode}
                    onChange={(v) => setWhatsapp({ ...whatsapp, countryCode: v })}
                    options={WA_COUNTRY_CODES}
                  />
                  <Input
                    label="WhatsApp number"
                    value={whatsapp.number}
                    onChange={(v) => setWhatsapp({ ...whatsapp, number: v })}
                    placeholder="5XXXXXXXX"
                  />
                </div>
                <Textarea
                  label="Pre-filled message (optional)"
                  value={whatsapp.message}
                  onChange={(v) => setWhatsapp({ ...whatsapp, message: v })}
                />
                <p className="text-xs text-charcoal/55">
                  Opens a chat to {whatsapp.countryCode}
                  {whatsapp.number || "…"} with your message pre-typed.
                </p>
              </div>
            )}
            {content_kind === "app_link" && (
              <div className="space-y-3">
                <Input
                  label="App name"
                  value={appLink.name}
                  onChange={(v) => setAppLink({ ...appLink, name: v })}
                  placeholder="My App"
                />
                <Input
                  label="App URL (App Store / Play Store)"
                  value={appLink.url}
                  onChange={(v) => setAppLink({ ...appLink, url: v })}
                  placeholder="https://apps.apple.com/..."
                />
                <Input
                  label="Fallback URL (desktop, optional)"
                  value={appLink.fallback}
                  onChange={(v) => setAppLink({ ...appLink, fallback: v })}
                  placeholder="Defaults to the App URL"
                />
                <p className="text-xs text-charcoal/55">
                  Points to the app link. Per-platform store routing comes
                  later — for now everyone goes to the App URL.
                </p>
              </div>
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

          {allowLogo && (
            <div className="mt-4">
              <span className="block text-sm font-medium text-charcoal/75">
                Logo (optional)
              </span>
              <div className="mt-1 flex items-center gap-3">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="logo"
                    className="h-10 w-10 rounded border border-charcoal/15 object-contain"
                  />
                )}
                <label className="cursor-pointer rounded-lg border border-charcoal/15 px-3 py-1.5 text-sm font-medium text-charcoal/75 hover:bg-sand-light/60">
                  {logoBusy ? "Uploading…" : logoUrl ? "Replace" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    disabled={logoBusy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogo(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="text-xs text-charcoal/45 hover:text-charcoal/75"
                  >
                    Remove
                  </button>
                )}
              </div>
              {logoErr && (
                <p className="mt-1 text-xs text-red-600">{logoErr}</p>
              )}
              <p className="mt-1 text-xs text-charcoal/45">
                PNG, JPG or SVG · under 500 KB · embedded in the QR center
              </p>
            </div>
          )}
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-deep-teal px-4 py-3 text-sm font-semibold text-white hover:bg-deep-teal-dark transition-colors duration-200 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save QR code"}
        </button>
      </div>

      {/* RIGHT — preview */}
      <aside className="lg:sticky lg:top-8 self-start">
        <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
          <QrPreview style={previewStyle} />
          {kind === "dynamic" && (
            <p className="mt-4 text-center text-xs text-charcoal/55">
              Embeds <code className="text-deep-teal">/r/{shortId}</code> · destination editable anytime
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal/55">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Input({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-charcoal/75">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm transition-colors duration-150 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/20"
      />
    </label>
  );
}

function Textarea({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-charcoal/75">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 block w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm transition-colors duration-150 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/20"
      />
    </label>
  );
}

function ColorField({
  label, value, onChange, clearable, onClear,
}: { label: string; value: string; onChange: (v: string) => void; clearable?: boolean; onClear?: () => void }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium text-charcoal/75">
        <span>{label}</span>
        {clearable && (
          <button type="button" onClick={onClear} className="text-xs text-charcoal/45 hover:text-charcoal/75">
            Clear
          </button>
        )}
      </span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-12 rounded border border-charcoal/15"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-lg border border-charcoal/15 px-2 py-1.5 text-sm font-mono"
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
      <span className="block text-sm font-medium text-charcoal/75">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm capitalize transition-colors duration-150 focus:border-deep-teal focus:outline-none focus:ring-2 focus:ring-deep-teal/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o.replace(/-/g, " ")}</option>
        ))}
      </select>
    </label>
  );
}

function KindCard({
  active, title, body, onClick, disabled,
}: { active: boolean; title: string; body: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-xl border p-4 transition disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "border-deep-teal bg-deep-teal/10 ring-2 ring-deep-teal/20"
          : "border-charcoal/15 bg-white hover:bg-sand-light/60"
      }`}
    >
      <h4 className="font-semibold text-charcoal">{title}</h4>
      <p className="mt-1 text-xs text-charcoal/55">{body}</p>
    </button>
  );
}
