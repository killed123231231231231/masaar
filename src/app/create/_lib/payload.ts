import {
  encodeVCard,
  encodeWifi,
  encodeEmail,
  encodeSms,
  encodePhone,
  encodeWhatsapp,
  encodeAppLink,
} from "@/lib/content-types";
import { normalizeUrl } from "@/lib/url";
import { appUrl } from "@/lib/utils";
import type { ContentKind, QrKind } from "@/types/database";
import {
  typeMeta,
  kindFor,
  defaultName,
  DEFAULT_CUSTOMIZATION,
  type Customization,
  type WizardType,
} from "./types";

// Mirrors the /api/qr + /api/qr/anonymous body. Reuses the SAME
// encoders/normalizer as the legacy builder — the wizard only
// rearranges the UI, it does not reimplement encoding.
export interface QrSavePayload {
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
  // C — file content types. destination carries the asset URL (so the
  // existing save routes persist it unchanged); these mirror it for
  // forward-compat with a future asset-column-aware edit flow.
  asset_url: string | null;
  asset_size: number | null;
  asset_mime: string | null;
  asset_filename: string | null;
}

export function buildPayload(args: {
  type: WizardType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: Record<string, any>;
  name: string;
  shortId: string;
  customization?: Customization;
}): { payload?: QrSavePayload; error?: string } {
  const { type, form, shortId } = args;
  const c = args.customization ?? DEFAULT_CUSTOMIZATION;
  const meta = typeMeta(type);
  if (!meta.backend) {
    return { error: "This content type isn’t available yet." };
  }
  const backend = meta.backend;

  let destination = "";
  let payload_json: Record<string, unknown> | null = null;
  let asset_url: string | null = null;
  let asset_size: number | null = null;
  let asset_mime: string | null = null;
  let asset_filename: string | null = null;

  switch (backend) {
    case "url": {
      const v = (form.url || "").trim();
      if (!v || v === "https://") return { error: "Enter a destination URL." };
      destination = normalizeUrl(v);
      break;
    }
    case "text": {
      const v = (form.text || "").trim();
      if (!v) return { error: "Enter some text." };
      destination = v;
      payload_json = { text: v };
      break;
    }
    case "vcard": {
      if (!(form.firstName || form.lastName))
        return { error: "Enter at least a name." };
      destination = encodeVCard(form);
      payload_json = form;
      break;
    }
    case "wifi": {
      if (!(form.ssid || "").trim())
        return { error: "Enter the network name (SSID)." };
      destination = encodeWifi({
        ssid: form.ssid,
        password: form.password,
        encryption: form.encryption,
        hidden: form.hidden,
      });
      payload_json = form;
      break;
    }
    case "email": {
      if (!(form.to || "").trim()) return { error: "Enter a recipient email." };
      destination = encodeEmail({
        to: form.to,
        subject: form.subject,
        body: form.body,
      });
      payload_json = form;
      break;
    }
    case "sms": {
      if (!(form.number || "").trim())
        return { error: "Enter a phone number." };
      destination = encodeSms({ number: form.number, message: form.message });
      payload_json = form;
      break;
    }
    case "phone": {
      const n = (form.number || "").trim();
      if (!n) return { error: "Enter a phone number." };
      destination = encodePhone(n);
      payload_json = { number: n };
      break;
    }
    case "whatsapp": {
      const num = (form.number || "").trim();
      if (!num) return { error: "Enter a WhatsApp number." };
      destination = encodeWhatsapp({
        phone: (form.countryCode || "+966") + num,
        message: form.message,
      });
      payload_json = form;
      break;
    }
    case "app_link": {
      const u = (form.url || "").trim();
      if (!u || u === "https://") return { error: "Enter the app URL." };
      destination = normalizeUrl(u);
      payload_json = form;
      break;
    }
    case "pdf":
    case "image":
    case "video": {
      // The Step-2 upload component sets form.asset_url (+ metadata) on a
      // successful upload to /api/upload/<bucket>. The asset URL is the
      // dynamic QR's destination — /r routes file types to /v, which
      // resolves it back via resolve_asset_qr (coalesce asset_url,
      // destination). A storage URL is a valid http(s) URL, so it passes
      // the dynamic-destination guard in both save routes.
      const url = (form.asset_url || "").trim();
      if (!url) {
        const noun =
          backend === "pdf" ? "a PDF" : backend === "image" ? "an image" : "a video";
        return { error: `Upload ${noun} first.` };
      }
      destination = url;
      asset_url = url;
      asset_size = typeof form.asset_size === "number" ? form.asset_size : null;
      asset_mime = typeof form.asset_mime === "string" ? form.asset_mime : null;
      asset_filename =
        typeof form.asset_filename === "string" ? form.asset_filename : null;
      break;
    }
    // Session D — hosted types. The data lives in payload_json; destination
    // is the hosted URL (valid http(s) so the save-route dynamic guard
    // passes). /r routes to the hosted page by content_kind, not destination.
    case "social": {
      const rawLinks = Array.isArray(form.links) ? form.links : [];
      const links = rawLinks
        .filter(
          (l: { platform?: string; url?: string }) =>
            l && l.platform && (l.url || "").trim()
        )
        .map((l: { platform: string; url: string }) => ({
          platform: l.platform,
          url: l.url.trim(),
        }));
      const displayName = (form.display_name || "").trim();
      if (!displayName && links.length === 0) {
        return { error: "Add your name or at least one social link." };
      }
      destination = `${appUrl()}/s/${shortId}`;
      payload_json = {
        display_name: displayName,
        bio: (form.bio || "").trim(),
        avatar_url: form.avatar_url || null,
        links,
      };
      break;
    }
    case "location": {
      const lat = parseFloat(form.lat);
      const lng = parseFloat(form.lng);
      if (!isFinite(lat) || !isFinite(lng)) {
        return { error: "Pick a location on the map." };
      }
      destination = `${appUrl()}/loc/${shortId}`;
      payload_json = { lat, lng, label: (form.label || "").trim() };
      break;
    }
    case "feedback": {
      destination = `${appUrl()}/f/${shortId}`;
      payload_json = {
        headline: (form.headline || "How was your experience?").trim(),
        prompt: (form.prompt || "Tell us more").trim(),
        ask_email: !!form.ask_email,
      };
      break;
    }
    default:
      return { error: "Unsupported content type." };
  }

  return {
    payload: {
      name: args.name?.trim() || defaultName(type),
      kind: kindFor(backend),
      content_kind: backend,
      short_id: shortId,
      destination,
      payload_json,
      fg_color: c.fg_color,
      bg_color: c.bg_color,
      gradient_color: c.gradient_color,
      dot_style: c.dot_style,
      corner_style: c.corner_style,
      logo_url: c.logo_url,
      asset_url,
      asset_size,
      asset_mime,
      asset_filename,
    },
  };
}
