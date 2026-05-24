import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShortId, isValidShortId } from "@/lib/shortid";
import { parseHttpUrl } from "@/lib/url";

// Anonymous QR creation for the public /create funnel. No auth. The
// insert runs through the SECURITY DEFINER create_anon_qr RPC (migration
// 005) which enforces a per-IP hourly cap server-side — we never grant
// anon a direct INSERT policy on qr_codes (gotcha #6).

const MAX_BODY_BYTES = 64 * 1024;
const MAX_DESTINATION_LEN = 2048;
const MAX_PAYLOAD_BYTES = 8 * 1024;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function sha256_16(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function POST(request: Request) {
  const len = request.headers.get("content-length");
  if (len && Number(len) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const draftToken = body.draft_token;
  if (typeof draftToken !== "string" || !UUID_RE.test(draftToken)) {
    return NextResponse.json({ error: "Valid draft_token required" }, { status: 400 });
  }

  if (
    typeof body.destination === "string" &&
    body.destination.length > MAX_DESTINATION_LEN
  ) {
    return NextResponse.json(
      { error: `Destination must be ${MAX_DESTINATION_LEN} characters or fewer.` },
      { status: 400 }
    );
  }
  if (
    body.payload_json != null &&
    JSON.stringify(body.payload_json).length > MAX_PAYLOAD_BYTES
  ) {
    return NextResponse.json({ error: "Structured payload too large." }, { status: 400 });
  }

  const kind = body.kind === "static" ? "static" : "dynamic";

  // A dynamic QR's printed code points at /r/<shortId> → must resolve to
  // a valid http(s) URL. Reject up front so we never persist a row the
  // redirect can't use.
  if (kind === "dynamic" && !parseHttpUrl(body.destination)) {
    return NextResponse.json(
      { error: "Dynamic QR codes need a valid http(s) destination URL." },
      { status: 400 }
    );
  }

  const shortId =
    kind === "dynamic"
      ? isValidShortId(body.short_id)
        ? body.short_id
        : generateShortId()
      : isValidShortId(body.short_id)
        ? body.short_id
        : generateShortId();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = await sha256_16(ip);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_anon_qr", {
    p_name: body.name || "Untitled",
    p_kind: kind,
    p_content_kind: body.content_kind || "url",
    p_destination: body.destination,
    p_payload_json: body.payload_json ?? null,
    p_short_id: shortId,
    p_draft_token: draftToken,
    p_fg_color: body.fg_color ?? "#000000",
    p_bg_color: body.bg_color ?? "#FFFFFF",
    p_gradient_color: body.gradient_color ?? null,
    p_dot_style: body.dot_style ?? "square",
    p_corner_style: body.corner_style ?? "square",
    p_ip_hash: ipHash,
    // B5/Round2 Bug R2.1+R2.2 — pass logo_url so qr_codes.logo_url is
    // populated. Without this the anon flow created rows with NULL
    // logo_url even when the wizard uploaded a logo to storage, so
    // both the checkout-page preview and the dashboard thumbnail
    // rendered without the logo (migration 014 adds the RPC param).
    p_logo_url: typeof body.logo_url === "string" ? body.logo_url : null,
  });

  if (error) {
    if (error.message?.includes("rate_limit_exceeded")) {
      return NextResponse.json(
        { error: "Too many QR codes created from this network. Try again later." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ id: row?.id, short_id: row?.short_id });
}
