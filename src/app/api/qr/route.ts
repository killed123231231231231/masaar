import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShortId, isValidShortId } from "@/lib/shortid";
import bcrypt from "bcryptjs";
import { parseHttpUrl } from "@/lib/url";
import type { QrCode } from "@/types/database";

// Boundary limits. A QR at error-correction level H can't encode much
// more than ~1KB anyway, and structured payloads are tiny — so reject
// oversized input instead of parsing/storing a 10MB paste.
const MAX_BODY_BYTES = 64 * 1024;
const MAX_DESTINATION_LEN = 2048;
const MAX_PAYLOAD_BYTES = 8 * 1024;

function bodyTooLarge(request: Request): boolean {
  const len = request.headers.get("content-length");
  return !!len && Number(len) > MAX_BODY_BYTES;
}

function sizeError(body: {
  destination?: unknown;
  payload_json?: unknown;
}): string | null {
  if (
    typeof body.destination === "string" &&
    body.destination.length > MAX_DESTINATION_LEN
  ) {
    return `Destination must be ${MAX_DESTINATION_LEN} characters or fewer.`;
  }
  if (
    body.payload_json != null &&
    JSON.stringify(body.payload_json).length > MAX_PAYLOAD_BYTES
  ) {
    return "Structured payload too large.";
  }
  return null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (bodyTooLarge(request)) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  const body = await request.json();

  const sizeErr = sizeError(body);
  if (sizeErr) return NextResponse.json({ error: sizeErr }, { status: 400 });

  // SaaS model: an active subscriber's QRs go live immediately (skip
  // the checkout lock-in). Everyone else's start pending_payment.
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();
  const subscribed = profile?.subscription_status === "active";

  const insert: Partial<QrCode> = {
    user_id: user.id,
    status: subscribed ? "active" : "pending_payment",
    name: body.name || "Untitled",
    kind: body.kind === "static" ? "static" : "dynamic",
    content_kind: body.content_kind || "url",
    destination: body.destination,
    payload_json: body.payload_json ?? null,
    fg_color: body.fg_color ?? "#000000",
    bg_color: body.bg_color ?? "#FFFFFF",
    gradient_color: body.gradient_color ?? null,
    dot_style: body.dot_style ?? "square",
    corner_style: body.corner_style ?? "square",
    logo_url: body.logo_url ?? null,
  };

  // I — power features: logo scale, frame text, and password (hashed).
  if (typeof body.logo_scale === "number") insert.logo_scale = body.logo_scale;
  if (typeof body.qr_text === "string" && body.qr_text.trim())
    insert.frame_text = body.qr_text.trim();
  if (typeof body.password === "string" && body.password.trim().length >= 4) {
    insert.password_hash = await bcrypt.hash(body.password.trim(), 10);
    insert.password_set_at = new Date().toISOString();
  }

  // A dynamic QR's printed code points at /r/<shortId>, which 302s to
  // `destination`. Reject anything that isn't a valid http(s) URL up front
  // so we never persist a row the redirect route can't resolve.
  if (insert.kind === "dynamic" && !parseHttpUrl(insert.destination)) {
    return NextResponse.json(
      { error: "Dynamic QR codes need a valid http(s) destination URL." },
      { status: 400 }
    );
  }

  if (insert.kind === "dynamic") {
    // Trust the client-generated shortId only if it's well-formed (so the
    // printed/previewed QR matches what we persist); otherwise generate.
    // The DB unique constraint still guards against collisions.
    insert.short_id = isValidShortId(body.short_id)
      ? body.short_id
      : generateShortId();
  }

  // Bug A: mirror create_anon_qr (migration 009) — on a short_id
  // unique-violation (Postgres 23505, qr_codes_short_id_key), keep the
  // client-provided id on attempt 1 (so the previewed QR matches), then
  // regenerate and retry up to 5 times before failing.
  let data = null;
  let error = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    ({ data, error } = await supabase
      .from("qr_codes")
      .insert(insert)
      .select()
      .single());
    if (!error) break;
    const shortIdCollision =
      error.code === "23505" && insert.kind === "dynamic";
    if (!shortIdCollision) break;
    insert.short_id = generateShortId();
  }

  if (error) {
    const collided = error.code === "23505";
    return NextResponse.json(
      {
        error: collided
          ? "Could not allocate a unique code — please try again."
          : error.message,
      },
      { status: collided ? 409 : 400 }
    );
  }
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (bodyTooLarge(request)) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sizeErr = sizeError(body);
  if (sizeErr) return NextResponse.json({ error: sizeErr }, { status: 400 });

  // Explicit allow-list. Spreading the request body let a client set any
  // column (kind, is_active, password_hash, payload_json, created_at, ...).
  // Only the two fields the edit UI actually changes are patchable.
  const patch: Partial<QrCode> = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.destination === "string") patch.destination = body.destination;
  // Design fields are editable. kind and content_kind are deliberately
  // NOT patchable — changing them would desync the encoded payload from
  // the printed code.
  if (typeof body.fg_color === "string") patch.fg_color = body.fg_color;
  if (typeof body.bg_color === "string") patch.bg_color = body.bg_color;
  if (typeof body.gradient_color === "string" || body.gradient_color === null)
    patch.gradient_color = body.gradient_color;
  if (typeof body.dot_style === "string") patch.dot_style = body.dot_style;
  if (typeof body.corner_style === "string") patch.corner_style = body.corner_style;
  // C2 — logo is now editable from the edit page (owner-scoped public
  // `logos` URL, or null to remove).
  if (typeof body.logo_url === "string" || body.logo_url === null)
    patch.logo_url = body.logo_url;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .update(patch)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Owner-scoped delete (RLS qr_codes_owner_all + the explicit user_id
  // guard). The BEFORE DELETE trigger (migration 020) queues any hosted
  // asset for storage cleanup. scans cascade via their FK.
  const { error } = await supabase
    .from("qr_codes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
