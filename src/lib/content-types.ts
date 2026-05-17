// Encoders that turn structured payloads into the raw string a QR scanner
// understands. All return the literal text to embed in the QR code.

export interface VCardPayload {
  firstName?: string;
  lastName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
}

export interface WifiPayload {
  ssid: string;
  password?: string;
  encryption?: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export interface EmailPayload {
  to: string;
  subject?: string;
  body?: string;
}

export interface SmsPayload {
  number: string;
  message?: string;
}

const escapeVCard = (v: string) =>
  v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function encodeVCard(p: VCardPayload): string {
  const name = `${escapeVCard(p.lastName || "")};${escapeVCard(p.firstName || "")};;;`;
  const fn = `${p.firstName || ""} ${p.lastName || ""}`.trim();
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${name}`,
    `FN:${escapeVCard(fn)}`,
    p.organization && `ORG:${escapeVCard(p.organization)}`,
    p.title && `TITLE:${escapeVCard(p.title)}`,
    p.phone && `TEL;TYPE=CELL:${p.phone}`,
    p.email && `EMAIL:${p.email}`,
    p.website && `URL:${p.website}`,
    p.address && `ADR:;;${escapeVCard(p.address)};;;;`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

const escapeWifi = (v: string) => v.replace(/([\\;,":])/g, "\\$1");

export function encodeWifi(p: WifiPayload): string {
  const T = p.encryption === "nopass" || !p.encryption ? "nopass" : p.encryption;
  const parts = [
    `T:${T}`,
    `S:${escapeWifi(p.ssid)}`,
    p.password && T !== "nopass" ? `P:${escapeWifi(p.password)}` : "",
    p.hidden ? "H:true" : "",
  ].filter(Boolean);
  return `WIFI:${parts.join(";")};;`;
}

export function encodeEmail(p: EmailPayload): string {
  const params = new URLSearchParams();
  if (p.subject) params.set("subject", p.subject);
  if (p.body) params.set("body", p.body);
  const qs = params.toString();
  return `mailto:${p.to}${qs ? `?${qs}` : ""}`;
}

export function encodeSms(p: SmsPayload): string {
  return p.message
    ? `SMSTO:${p.number}:${p.message}`
    : `sms:${p.number}`;
}

export function encodePhone(number: string): string {
  return `tel:${number}`;
}
