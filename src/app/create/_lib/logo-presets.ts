// Session I — one-click logo presets. These are GENERIC category icons
// (coffee, food, location…), NOT copyrighted brand logos — trademark-safe
// and genuinely useful for GCC F&B / retail. Each is a small SVG (teal
// glyph on a white rounded tile) encoded as a data URL; picking one sets
// qr_codes.logo_url to it, so it renders in the QR center like any logo.

function dataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// White rounded tile so the glyph reads against the QR; teal stroked glyph.
function tile(glyph: string): string {
  return dataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#ffffff"/><g fill="none" stroke="#0F5B55" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${glyph}</g></svg>`
  );
}

export interface LogoPreset {
  key: string;
  label: string;
  url: string;
}

export const LOGO_PRESETS: LogoPreset[] = [
  { key: "coffee", label: "Coffee", url: tile('<path d="M17 25h21v11a10 10 0 0 1-10 10h-1a10 10 0 0 1-10-10z"/><path d="M38 27h4a5 5 0 0 1 0 10h-4"/><path d="M22 14v4M30 14v4"/>') },
  { key: "food", label: "Restaurant", url: tile('<path d="M23 14v16M29 14v16M26 14v36"/><path d="M41 14c-3 0-5 4-5 10s2 8 5 8v18"/>') },
  { key: "pin", label: "Location", url: tile('<path d="M32 50s12-11 12-21a12 12 0 0 0-24 0c0 10 12 21 12 21z"/><circle cx="32" cy="29" r="5"/>') },
  { key: "heart", label: "Heart", url: tile('<path d="M32 47s-14-8-14-19a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 11-14 19-14 19z"/>') },
  { key: "star", label: "Star", url: tile('<path d="M32 15l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z"/>') },
  { key: "bag", label: "Shop", url: tile('<path d="M19 23h26l-2 26a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3z"/><path d="M25 23a7 7 0 0 1 14 0"/>') },
  { key: "phone", label: "Phone", url: tile('<rect x="23" y="13" width="18" height="38" rx="4"/><path d="M30 45h4"/>') },
  { key: "chat", label: "Chat", url: tile('<path d="M16 25a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H28l-9 7v-7a4 4 0 0 1-3-4z"/>') },
  { key: "cart", label: "Cart", url: tile('<path d="M16 16h4l4 22h20l3-15H22"/><circle cx="26" cy="46" r="3"/><circle cx="42" cy="46" r="3"/>') },
  { key: "gift", label: "Gift", url: tile('<rect x="18" y="28" width="28" height="20" rx="2"/><path d="M16 28h32M32 22v26"/><path d="M32 22c-2-6-10-6-9 0M32 22c2-6 10-6 9 0"/>') },
  { key: "leaf", label: "Organic", url: tile('<path d="M46 18c0 16-10 26-26 26 0-16 10-26 26-26z"/><path d="M20 44C28 36 36 30 44 24"/>') },
  { key: "scissors", label: "Salon", url: tile('<circle cx="22" cy="22" r="5"/><circle cx="22" cy="42" r="5"/><path d="M26 26l22 16M26 38l22-16"/>') },
];
