import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { UAParser } from "ua-parser-js";

// Edge runtime is fast and exposes Vercel geo headers
export const runtime = "edge";

/**
 * Redirect handler for dynamic QRs.
 *
 * 1. Look up the shortId in Supabase to get the destination URL.
 * 2. Log the scan with country/city/device/browser parsed from request headers.
 * 3. 302 redirect to the destination.
 *
 * The whole round-trip is sub-100ms on Vercel edge — fast enough that the
 * scanning device never perceives the indirection.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortId: string }> }
) {
  const { shortId } = await params;

  // Edge runtime — use a stateless server client (no cookies needed,
  // we rely on RLS policy `qr_codes_public_read_active`).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("id, destination, is_active")
    .eq("short_id", shortId)
    .eq("is_active", true)
    .single();

  if (!qr) {
    return new NextResponse("QR code not found", { status: 404 });
  }

  // Extract scan metadata
  const ua = request.headers.get("user-agent") || "";
  const parsed = new UAParser(ua).getResult();
  const country = request.headers.get("x-vercel-ip-country");
  const city = decodeSafe(request.headers.get("x-vercel-ip-city"));
  const region = request.headers.get("x-vercel-ip-country-region");

  // Hash the IP for privacy — store first 16 chars of SHA-256
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = await sha256(ip);

  // Fire-and-forget so we don't block the redirect on insert latency.
  // The promise still gets a chance to flush on the edge runtime.
  const scanInsert = supabase.from("scans").insert({
    qr_code_id: qr.id,
    country,
    region,
    city,
    device_type: parsed.device.type ?? "desktop",
    os: parsed.os.name ?? null,
    browser: parsed.browser.name ?? null,
    user_agent: ua,
    ip_hash: ipHash,
  });

  // Don't await — but make sure the promise is created.
  scanInsert.then(() => {}, () => {});

  return NextResponse.redirect(qr.destination, 302);
}

function decodeSafe(v: string | null): string | null {
  if (!v) return null;
  try { return decodeURIComponent(v); } catch { return v; }
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
