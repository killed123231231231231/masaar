import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShortId, isValidShortId } from "@/lib/shortid";
import bcrypt from "bcryptjs";
import { parseHttpUrl } from "@/lib/url";
import { checkDestination } from "@/lib/url-safety";
import { qrCacheSet, qrCacheDelete, toCachedQr } from "@/lib/qr-edge-cache";
import {
  cleanHexArray,
  cleanPaletteOptions,
  DOT_PALETTE_MIN,
  DOT_PALETTE_MAX,
  CORNER_COUNT,
} from "@/lib/palette";
import type { QrCode } from "@/types/database";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { ipHash as hashRequestIp } from "@/lib/ip-hash";
import {
  DEFAULT_QR_QUOTA,
  isAdminEmail,
  isQuotaError,
  quotaExceededResponse,
} from "@/lib/quota";

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

const LOCKED_MESSAGE =
  "This QR code was disabled by an administrator. Contact support.";

function lockedResponse() {
  return NextResponse.json({ error: "locked", message: LOCKED_MESSAGE }, { status: 403 });
}

// Map the migration-031 guard_qr_update() exceptions to clean 403s.
function guardErrorResponse(err: { message?: string } | null) {
  const m = err?.message ?? "";
  if (m.includes("qr_locked_by_admin")) return lockedResponse();
  if (m.includes("immutable_field") || m.includes("admin_only_field")) {
    return NextResponse.json(
      { error: "forbidden_field", message: "That field can't be changed." },
      { status: 403 }
    );
  }
  return null;
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Pre-check the free-plan cap so the user gets a clean message even before
// migration 031's enforce_qr_quota trigger exists. profiles.qr_quota is
// added by 031; until then the select errors and the default applies.
async function overQuota(supabase: ServerClient, userId: string): Promise<boolean> {
  let quota = DEFAULT_QR_QUOTA;
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("qr_quota")
    .eq("id", userId)
    .maybeSingle();
  if (!profErr) {
    const q = (prof as { qr_quota?: number | null } | null)?.qr_quota;
    if (typeof q === "number" && q > 0) quota = q;
  }
  const { count, error } = await supabase
    .from("qr_codes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error || count == null) return false; // never block on a count failure
  return count >= quota;
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

  // Free public plan: 30 creates/hour per account AND 60/hour per network.
  const ipKey = await hashRequestIp(request);
  const [byUser, byIp] = await Promise.all([
    rateLimit("qr_create_user", user.id, 30, 3600),
    rateLimit("qr_create_ip", ipKey, 60, 3600),
  ]);
  if (!byUser.ok || !byIp.ok) return rateLimitedResponse();

  if (!isAdminEmail(user.email) && (await overQuota(supabase, user.id))) {
    return quotaExceededResponse();
  }

  const body = await request.json();

  const sizeErr = sizeError(body);
  if (sizeErr) return NextResponse.json({ error: sizeErr }, { status: 400 });

  // Every signed-in user's QR goes live immediately. The per-QR paywall
  // now applies ONLY to anonymous creators (handled in /api/qr/anonymous
  // → email gate → /checkout). This route is auth-gated above, so anyone
  // reaching here is a logged-in user, subscriber or not.
  const insert: Partial<QrCode> = {
    user_id: user.id,
    status: "active",
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
  if (typeof body.frame_style === "string" && body.frame_style !== "none")
    insert.frame_style = body.frame_style;
  if (typeof body.frame_color === "string") insert.frame_color = body.frame_color;
  if (typeof body.text_color === "string") insert.text_color = body.text_color;

  // Migration 029 — multi-color dots + per-corner colors. Strict hex-array
  // validation; anything malformed is dropped (renders single-color).
  const dotPalette = cleanHexArray(body.dot_palette, DOT_PALETTE_MIN, DOT_PALETTE_MAX);
  if (dotPalette) {
    insert.dot_palette = dotPalette;
    // Palette and gradient are mutually exclusive (the renderer lets the
    // palette win); enforce it server-side so a row never persists both and
    // the edit UI can't seed a contradictory gradient+multicolor state.
    insert.gradient_color = null;
  }
  const cornerColors = cleanHexArray(body.corner_colors, CORNER_COUNT, CORNER_COUNT);
  if (cornerColors) insert.corner_colors = cornerColors;
  // Migration 030 — distribution options only make sense with a palette.
  const paletteOptions = dotPalette ? cleanPaletteOptions(body.palette_options) : null;
  if (paletteOptions) insert.palette_options = paletteOptions;

  // A dynamic QR's printed code points at /r/<shortId>, which 302s to
  // `destination`. Reject anything that isn't a valid http(s) URL up front
  // so we never persist a row the redirect route can't resolve.
  if (insert.kind === "dynamic" && !parseHttpUrl(insert.destination)) {
    return NextResponse.json(
      { error: "Dynamic QR codes need a valid http(s) destination URL." },
      { status: 400 }
    );
  }
  // Abuse guard for new website-link QRs: no credentials, private hosts or
  // blocked domains (see lib/url-safety).
  if (insert.kind === "dynamic" && insert.content_kind === "url") {
    const safe = checkDestination(insert.destination);
    if (!safe.ok) {
      return NextResponse.json(
        { error: "unsafe_destination", message: safe.reason },
        { status: 400 }
      );
    }
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
    if (isQuotaError(error)) return quotaExceededResponse();
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
  // Seed the /r edge cache off the response path (outage armor — see
  // lib/qr-edge-cache). Static QRs have no short_id and never hit /r.
  const created = data as QrCode | null;
  if (created?.short_id) {
    const sid = created.short_id;
    after(async () => qrCacheSet(sid, toCachedQr(created)));
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

  if (!(await rateLimit("qr_update_user", user.id, 120, 3600)).ok) {
    return rateLimitedResponse();
  }

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sizeErr = sizeError(body);
  if (sizeErr) return NextResponse.json({ error: sizeErr }, { status: 400 });

  // Read the live row first (owner-scoped). select("*") so the route works
  // both before and after migration 031 adds admin_locked.
  const { data: curRow } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", body.id)
    .eq("user_id", user.id)
    .maybeSingle();
  const cur = curRow as (QrCode & { admin_locked?: boolean | null }) | null;
  if (!cur) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Abuse takedown: an admin-locked QR can't be edited or re-activated by
  // its owner. admin_locked is undefined until migration 031 → not locked.
  if (cur.admin_locked === true) return lockedResponse();

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

  // I — the edit page reuses the create Step-3 panel, so these design fields
  // (logo scale, frame + frame label) are editable too. Mirror the POST
  // route's normalisation: empty frame label → null, "none" frame → null.
  if (typeof body.logo_scale === "number") patch.logo_scale = body.logo_scale;
  if (typeof body.qr_text === "string")
    patch.frame_text = body.qr_text.trim() || null;
  if (typeof body.frame_style === "string")
    patch.frame_style = body.frame_style !== "none" ? body.frame_style : null;
  if (typeof body.frame_color === "string") patch.frame_color = body.frame_color;
  if (typeof body.text_color === "string") patch.text_color = body.text_color;

  // Migration 029 — multi-color dots + per-corner colors. Explicit null
  // clears the feature; a valid hex array sets it; anything else is ignored.
  if (body.dot_palette === null) patch.dot_palette = null;
  else {
    const dp = cleanHexArray(body.dot_palette, DOT_PALETTE_MIN, DOT_PALETTE_MAX);
    if (dp) {
      patch.dot_palette = dp;
      // Mutually exclusive with gradient (renderer: palette wins) — clear any
      // gradient so the row never holds a contradictory both-on state.
      patch.gradient_color = null;
    }
  }
  if (body.corner_colors === null) patch.corner_colors = null;
  else {
    const cc = cleanHexArray(body.corner_colors, CORNER_COUNT, CORNER_COUNT);
    if (cc) patch.corner_colors = cc;
  }
  // Migration 030 — same explicit-null-clears semantics as the arrays. If the
  // palette itself is being cleared, the options go with it.
  if (body.palette_options === null || patch.dot_palette === null) {
    patch.palette_options = null;
  } else {
    const po = cleanPaletteOptions(body.palette_options);
    if (po) patch.palette_options = po;
  }

  // Type conversion — DYNAMIC → "url" only. content_kind is otherwise
  // immutable: changing a STATIC QR's type would desync its printed payload
  // (the code encodes the payload directly), and every other target type
  // (pdf/image/video/social/location/feedback/whatsapp/…) needs its own
  // content/asset flow. This single path is safe because a DYNAMIC QR's
  // printed code is /r/<shortId> — unchanged by the conversion; only where
  // /r resolves changes. Guarded on the LIVE row's kind (never the client's
  // claim) and requires a valid http(s) destination.
  if (body.content_kind === "url") {
    if (cur.kind === "dynamic" && cur.content_kind !== "url") {
      const u = parseHttpUrl(
        typeof body.destination === "string" ? body.destination : ""
      );
      if (!u) {
        return NextResponse.json(
          { error: "Enter a valid website URL (https://…) to convert this QR." },
          { status: 400 }
        );
      }
      patch.content_kind = "url";
      patch.destination = u.toString();
      // A url QR resolves via its destination, never a hosted asset — clear
      // any old asset so no asset-aware path can still route it to /v.
      patch.asset_url = null;
      patch.asset_mime = null;
      patch.asset_size = null;
      patch.asset_filename = null;
    }
  }

  // Owner-facing Active/Inactive toggle: accept ONLY the literal values
  // "active" or "suspended" (draft/pending_payment are workflow-gated and must
  // never be set here). The existing owner scope (.eq("user_id") + RLS) keeps
  // this to the user's own QRs. A suspended QR's scans land on /expired.
  if (body.status === "active" || body.status === "suspended") {
    patch.status = body.status;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Abuse guard ONLY when a website-link destination actually changes.
  // Unchanged destinations of existing printed QRs are never re-validated
  // (Rule 0) — an old link that predates these rules keeps working.
  const nextKind = patch.content_kind ?? cur.content_kind;
  if (
    nextKind === "url" &&
    typeof patch.destination === "string" &&
    patch.destination !== cur.destination
  ) {
    const safe = checkDestination(patch.destination);
    if (!safe.ok) {
      return NextResponse.json(
        { error: "unsafe_destination", message: safe.reason },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .update(patch)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return guardErrorResponse(error) ?? NextResponse.json({ error: error.message }, { status: 400 });
  }
  // Keep the /r edge cache truthful the moment an edit/toggle lands — a
  // destination change or Active⇄Inactive flip must not wait for the
  // next scan's revalidate to take effect.
  const updated = data as QrCode | null;
  if (updated?.short_id) {
    const sid = updated.short_id;
    after(async () => qrCacheSet(sid, toCachedQr(updated)));
  }
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
