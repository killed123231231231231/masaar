import type { ContentKind, QrKind } from "@/types/database";

// Wizard-level content type. Superset of backend ContentKind — the
// extra ones (pdf/image/video/location/feedback/menu/payment) are
// owned by later sessions; their Step-2 forms are stubs for now.
export type WizardType =
  | "url"
  | "text"
  | "vcard"
  | "wifi"
  | "email"
  | "sms"
  | "phone"
  | "whatsapp"
  | "app_link"
  | "pdf"
  | "image"
  | "video"
  | "location"
  | "feedback"
  | "menu"
  | "payment";

export interface TypeMeta {
  key: WizardType;
  label: string;
  desc: string;
  icon: string; // lucide icon name (resolved in Step 1)
  badge?: "MOST USED" | "NEW" | "Coming soon";
  /** Backend content_kind, or null if its backend lands in a later session. */
  backend: ContentKind | null;
  /** Step-2 form implemented in this session? */
  ready: boolean;
}

// Order = spec §2 usage order. "Text" appended (spec §3 wants its form
// in the first half and it's a real backend content_kind).
export const CONTENT_TYPES: TypeMeta[] = [
  { key: "url", label: "Website", desc: "Open a website or landing page", icon: "Globe", badge: "MOST USED", backend: "url", ready: true },
  { key: "pdf", label: "PDF", desc: "Open a PDF document", icon: "FileText", backend: null, ready: false },
  { key: "image", label: "Image", desc: "Display an image or photo", icon: "Image", backend: null, ready: false },
  { key: "vcard", label: "vCard", desc: "Share a digital business card", icon: "Contact", backend: "vcard", ready: true },
  { key: "video", label: "Video", desc: "Display a video with one scan", icon: "Video", backend: null, ready: false },
  { key: "app_link", label: "App Link", desc: "Redirect to different App stores", icon: "Link2", backend: "app_link", ready: true },
  { key: "whatsapp", label: "WhatsApp", desc: "Start a WhatsApp chat instantly", icon: "MessageCircle", backend: "whatsapp", ready: true },
  { key: "sms", label: "SMS", desc: "Send text message instantly", icon: "MessageSquare", backend: "sms", ready: true },
  { key: "wifi", label: "WiFi", desc: "Connect to a WiFi network", icon: "Wifi", backend: "wifi", ready: true },
  { key: "email", label: "Email", desc: "Open mail app with prefilled message", icon: "Mail", backend: "email", ready: true },
  { key: "phone", label: "Phone", desc: "Start a phone call", icon: "Phone", backend: "phone", ready: true },
  { key: "text", label: "Text", desc: "Encode plain text", icon: "Type", backend: "text", ready: true },
  { key: "location", label: "Location", desc: "Open in Google or Apple Maps", icon: "MapPin", backend: null, ready: false },
  { key: "feedback", label: "Feedback", desc: "Collect customer feedback", icon: "Star", backend: null, ready: false },
  { key: "menu", label: "Restaurant Menu", desc: "Build a digital menu", icon: "UtensilsCrossed", backend: null, ready: false },
  { key: "payment", label: "Payment", desc: "Coming soon", icon: "Wallet", badge: "Coming soon", backend: null, ready: false },
];

export function typeMeta(t: WizardType): TypeMeta {
  return CONTENT_TYPES.find((c) => c.key === t) ?? CONTENT_TYPES[0];
}

// url / whatsapp / app_link produce a URL → routed through /r/ (dynamic,
// editable, trackable). Everything else encodes its payload directly.
const DYNAMIC: ContentKind[] = ["url", "whatsapp", "app_link"];
export function kindFor(backend: ContentKind): QrKind {
  return DYNAMIC.includes(backend) ? "dynamic" : "static";
}

export interface Customization {
  fg_color: string;
  bg_color: string;
  gradient_color: string | null;
  dot_style: string;
  corner_style: string;
  qr_text: string;
  logo_url: string | null;
  password: string;
}

export const DEFAULT_CUSTOMIZATION: Customization = {
  fg_color: "#000000",
  bg_color: "#FFFFFF",
  gradient_color: null,
  dot_style: "square",
  corner_style: "square",
  qr_text: "",
  logo_url: null,
  password: "",
};

export const DOT_STYLES = [
  "square", "dots", "rounded", "classy", "classy-rounded", "extra-rounded",
];
export const CORNER_STYLES = ["square", "dot", "extra-rounded"];

export interface WizardState {
  step: 1 | 2 | 3;
  max_step?: 1 | 2 | 3;
  content_type: WizardType | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form_data: Record<string, any>;
  customization: Customization;
  name: string;
  short_id?: string;
  draft_token?: string;
}

export const WIZARD_KEY = "masaar.wizard_state";

export function defaultName(t: WizardType): string {
  return `My ${typeMeta(t).label} QR`;
}
