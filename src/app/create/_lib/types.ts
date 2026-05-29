import type { ContentKind, QrKind } from "@/types/database";

// Wizard-level content type. Superset of backend ContentKind — the
// extra ones (pdf/image/video/location/feedback/menu/payment) are
// owned by later sessions; their Step-2 forms are stubs for now.
export type WizardType =
  | "url"
  | "text"
  | "vcard"
  | "social"
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

// Order mirrors getqr.com's Step-1 grid 1:1 (the types getqr surfaces,
// in its order), then Masaar-only extras (Phone, Text, Restaurant Menu)
// last. Descriptions match getqr's exact wording for the shared cards.
// `social` ships its full bio-links feature in Session D (card visible
// now); location/feedback/payment activate in Session D too.
export const CONTENT_TYPES: TypeMeta[] = [
  { key: "url", label: "Website", desc: "Open a website or landing page", icon: "Globe", badge: "MOST USED", backend: "url", ready: true },
  { key: "vcard", label: "vCard", desc: "Share a digital business card", icon: "Contact", backend: "vcard", ready: true },
  { key: "social", label: "Social Media", desc: "Share your profile & grow audience", icon: "Share2", backend: null, ready: false },
  { key: "app_link", label: "App Link", desc: "Redirects to different App stores", icon: "Link2", backend: "app_link", ready: true },
  { key: "pdf", label: "PDF", desc: "Open a PDF document", icon: "FileText", backend: "pdf", ready: true },
  { key: "image", label: "Image", desc: "Display an image or photo", icon: "Image", backend: "image", ready: true },
  { key: "video", label: "Video", desc: "Display a video with one scan", icon: "Video", backend: "video", ready: true },
  { key: "wifi", label: "WiFi", desc: "Connect to a WiFi network", icon: "Wifi", backend: "wifi", ready: true },
  { key: "email", label: "Email", desc: "Open a prefilled email", icon: "Mail", backend: "email", ready: true },
  { key: "sms", label: "SMS", desc: "Send text message instantly", icon: "MessageSquare", backend: "sms", ready: true },
  { key: "whatsapp", label: "WhatsApp", desc: "Start a WhatsApp chat instantly", icon: "MessageCircle", backend: "whatsapp", ready: true },
  { key: "location", label: "Location", desc: "Open a location in Google Maps", icon: "MapPin", backend: null, ready: false },
  { key: "payment", label: "Payment", desc: "Receive payments", icon: "Wallet", badge: "Coming soon", backend: null, ready: false },
  { key: "feedback", label: "Feedback", desc: "Request feedback or a review", icon: "Star", backend: null, ready: false },
  // Masaar-only extras (getqr has no equivalent) — kept last.
  { key: "phone", label: "Phone", desc: "Start a phone call", icon: "Phone", backend: "phone", ready: true },
  { key: "text", label: "Text", desc: "Encode plain text", icon: "Type", backend: "text", ready: true },
  { key: "menu", label: "Restaurant Menu", desc: "Build a digital menu", icon: "UtensilsCrossed", badge: "Coming soon", backend: null, ready: false },
];

export function typeMeta(t: WizardType): TypeMeta {
  return CONTENT_TYPES.find((c) => c.key === t) ?? CONTENT_TYPES[0];
}

// url / whatsapp / app_link produce a URL → routed through /r/ (dynamic,
// editable, trackable). File types (pdf/image/video) are also dynamic:
// they encode /r/<shortId>, which routes to the hosted /v page — that
// gives them scan analytics + the payment lock-in. Everything else
// encodes its payload directly.
const DYNAMIC: ContentKind[] = [
  "url",
  "whatsapp",
  "app_link",
  "pdf",
  "image",
  "video",
];
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
  /** Logo scale as a fraction of the QR (qr-code-styling imageSize). */
  logo_scale: number;
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
  logo_scale: 0.3,
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
  /** Epoch ms when draft_token was generated. Used by the wizard mount
   *  to rotate the token when it's older than DRAFT_TOKEN_TTL_MS — see
   *  SPRINT2.md 2026-05-24 contamination fix entry for why. */
  draft_token_created_at?: number;
}

export const WIZARD_KEY = "masaar.wizard_state";

/** Stale-token rotation window. If a wizard mount finds a draft_token
 *  in localStorage older than this, it regenerates the token and wipes
 *  the wizard's form state — pairs with the server-side 24h cap in
 *  migration 015 so a left-open tab from yesterday can't carry a token
 *  that quietly attaches today's row to an orphan row in the DB. */
export const DRAFT_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function defaultName(t: WizardType): string {
  return `My ${typeMeta(t).label} QR`;
}
