import { NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { appUrl, supabaseUrl } from "@/lib/env";

// B7/P1-2 — SSRF guard. `logo_url` is attacker-influenceable (the anon
// create route accepts an arbitrary string), and compositeLogo fetches
// it server-side. Only allow URLs that live under this project's
// Supabase Storage origin; everything else is refused before the fetch
// so the render server can't be turned into an internal-host probe.
function isAllowedLogoUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    const storage = new URL(supabaseUrl());
    return (
      u.origin === storage.origin && u.pathname.startsWith("/storage/")
    );
  } catch {
    return false;
  }
}

// Server-side PNG render. Used by the welcome email's <img>, the
// dashboard thumbnails (QrThumb), and the QR-codes list. `qrcode` is
// zero-DOM. When the QR row has a logo_url we composite the logo on
// top via `sharp`, with a bg-colored pad behind it so it doesn't
// conflict with the dots. Node runtime.
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  // B7/P1-1 — was createAdminClient() (service role, bypassed RLS so any
  // UUID-holder could render any QR, incl. a static QR's full payload).
  // Now the cookie-aware client + get_renderable_qr() definer renders
  // only active QRs (public) or the authenticated owner's QRs (any
  // status, for dashboard thumbnails). No service-role key needed here.
  const supabase = await createClient();
  const { data: rows, error } = await supabase.rpc("get_renderable_qr", {
    p_id: id,
  });
  const qr = Array.isArray(rows) ? rows[0] : null;
  if (error || !qr) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const data =
    qr.kind === "dynamic" && qr.short_id
      ? `${appUrl()}/r/${qr.short_id}`
      : qr.destination || " ";

  const url = new URL(_req.url);
  const sizeParam = Number(url.searchParams.get("size"));
  const width = Math.min(1024, Math.max(128, sizeParam || 512));
  const wantsDownload = url.searchParams.get("download") === "1";
  const fg = qr.fg_color || "#000000";
  const bg = qr.bg_color || "#FFFFFF";

  // EC level H (~30% recovery) when we punch a hole for a logo;
  // otherwise M (15%) is plenty and gives more dot real estate.
  const qrBuf = await QRCode.toBuffer(data, {
    width,
    margin: 1,
    errorCorrectionLevel: qr.logo_url ? "H" : "M",
    color: { dark: fg, light: bg },
  });

  // Default: bare QR. Composite logo on top if present AND the logo
  // URL is under our Storage origin (B7/P1-2 SSRF guard). An
  // off-origin logo_url is silently ignored — the QR still scans.
  let outBuf: Buffer = qrBuf;
  if (qr.logo_url && isAllowedLogoUrl(qr.logo_url)) {
    outBuf = await compositeLogo(qrBuf, qr.logo_url, width, bg);
  }

  const safeName = (qr.name || "masaar-qr")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .slice(0, 60);
  const filename = `${safeName}-${qr.short_id || id.slice(0, 8)}.png`;

  // B7/P1-1 — an active QR renders identically for everyone, so it can
  // sit in a shared cache; an owner-only (non-active) render must never
  // land in a shared CDN cache or it could re-leak to a non-owner.
  const cacheControl = wantsDownload
    ? "no-store"
    : qr.status === "active"
      ? "public, max-age=300"
      : "private, max-age=60";

  return new Response(new Uint8Array(outBuf), {
    headers: {
      "content-type": "image/png",
      "cache-control": cacheControl,
      ...(wantsDownload
        ? { "content-disposition": `attachment; filename="${filename}"` }
        : {}),
    },
  });
}

/**
 * Best-effort logo composite. On any failure (fetch error, sharp parse
 * error, weird SVG, network timeout), returns the bare QR — never
 * fails the whole request over a bad logo. The QR data is unchanged
 * so the code still scans either way.
 */
async function compositeLogo(
  qrBuf: Buffer,
  logoUrl: string,
  width: number,
  bgColor: string
): Promise<Buffer> {
  try {
    // 8-second timeout — anything slower is unhealthy; better to ship
    // the bare QR than block the whole response.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(logoUrl, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`logo fetch ${res.status}`);
    const logoBytes = Buffer.from(await res.arrayBuffer());

    // Logo occupies ~22% of the QR width — matches qr-code-styling's
    // default `imageSize: 0.3` (which is logo-of-data-area, not of
    // total; once you account for the margin, 0.3 * data ≈ 0.22 * total).
    const logoSize = Math.round(width * 0.22);
    // bg pad is slightly larger than the logo so the logo doesn't sit
    // directly on dot pixels.
    const padSize = Math.round(logoSize * 1.18);

    // SVG inputs need a density hint so sharp rasterizes at the target
    // size, not the SVG's intrinsic viewBox. PNG/JPG ignore density.
    const resizedLogo = await sharp(logoBytes, { density: 300 })
      .resize(logoSize, logoSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    // Solid pad in the QR's bg color — same trick qr-code-styling's
    // `hideBackgroundDots: true` uses to clear the dots behind the logo.
    const padRgb = hexToRgb(bgColor);
    const pad = await sharp({
      create: {
        width: padSize,
        height: padSize,
        channels: 4,
        background: { ...padRgb, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    return await sharp(qrBuf)
      .composite([
        { input: pad, gravity: "center" },
        { input: resizedLogo, gravity: "center" },
      ])
      .png()
      .toBuffer();
  } catch (e) {
    console.warn("[render.png] logo composite failed, serving bare QR:", e);
    return qrBuf;
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i.exec(hex.trim());
  if (!m) return { r: 255, g: 255, b: 255 };
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
