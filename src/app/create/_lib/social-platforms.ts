// Shared social-platform metadata (no "use client" — imported by both the
// builder form and the server-rendered /s hosted page). Brand colors only;
// no brand glyphs (lucide dropped them) — we render a colored chip + label.

export interface SocialPlatform {
  key: string;
  label: string;
  color: string;
  placeholder: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "instagram", label: "Instagram", color: "#E1306C", placeholder: "https://instagram.com/username" },
  { key: "whatsapp", label: "WhatsApp", color: "#25D366", placeholder: "https://wa.me/9665XXXXXXXX" },
  { key: "x", label: "X", color: "#111827", placeholder: "https://x.com/username" },
  { key: "tiktok", label: "TikTok", color: "#111827", placeholder: "https://tiktok.com/@username" },
  { key: "facebook", label: "Facebook", color: "#1877F2", placeholder: "https://facebook.com/username" },
  { key: "youtube", label: "YouTube", color: "#FF0000", placeholder: "https://youtube.com/@channel" },
  { key: "linkedin", label: "LinkedIn", color: "#0A66C2", placeholder: "https://linkedin.com/in/username" },
  { key: "snapchat", label: "Snapchat", color: "#F7B500", placeholder: "https://snapchat.com/add/username" },
  { key: "telegram", label: "Telegram", color: "#26A5E4", placeholder: "https://t.me/username" },
  { key: "website", label: "Website", color: "#0F5B55", placeholder: "https://example.com" },
];

export function platformMeta(key: string): SocialPlatform {
  return (
    SOCIAL_PLATFORMS.find((p) => p.key === key) ?? {
      key,
      label: key,
      color: "#0F5B55",
      placeholder: "https://",
    }
  );
}
