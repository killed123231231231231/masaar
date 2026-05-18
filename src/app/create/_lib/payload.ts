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
    },
  };
}
