import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// C/4 — single upload gateway for the file-hosted content types. The
// three buckets (qr-pdfs / qr-images / qr-videos) deliberately have NO
// client-write policy (migration 021), so EVERY write goes through here
// on the service role. Auth is either a logged-in user OR an anonymous
// wizard carrying a draft_token — the same model as the anon logo upload
// (/api/qr/anonymous/logo). At upload time no qr_codes row exists yet;
// the draft_token claims the row at checkout, and the asset_url is saved
// onto the QR at create time. Size + MIME are validated here AND enforced
// by the bucket itself (migration 021) as defense-in-depth.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BUCKETS: Record<
  string,
  { mime: Record<string, string>; max: number; label: string }
> = {
  "qr-pdfs": {
    mime: { "application/pdf": "pdf" },
    max: 10 * 1024 * 1024,
    label: "PDF, up to 10 MB",
  },
  "qr-images": {
    mime: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
    max: 5 * 1024 * 1024,
    label: "JPG, PNG or WebP, up to 5 MB",
  },
  "qr-videos": {
    mime: { "video/mp4": "mp4", "video/webm": "webm" },
    max: 25 * 1024 * 1024,
    label: "MP4 or WebM, up to 25 MB",
  },
};

async function sha256_16(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bucket: string }> }
) {
  const { bucket } = await params;
  const cfg = BUCKETS[bucket];
  if (!cfg) {
    return NextResponse.json({ error: "unknown_bucket" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  const ext = cfg.mime[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "unsupported_mime", message: `Allowed: ${cfg.label}.` },
      { status: 400 }
    );
  }
  if (file.size > cfg.max) {
    return NextResponse.json(
      { error: "too_large", message: `File exceeds the limit (${cfg.label}).` },
      { status: 413 }
    );
  }

  // Auth: logged-in user takes the user-id path prefix; otherwise an
  // anonymous wizard must present a well-formed draft_token.
  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();

  const draftToken = form.get("draft_token");
  let prefix: string;
  if (user) {
    prefix = user.id;
  } else if (typeof draftToken === "string" && UUID_RE.test(draftToken)) {
    prefix = `anon/${draftToken}`;
  } else {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Rate-limit EVERY upload: 10/hour per IP (always) AND per user (when
  // authed), via the dedicated record_file_upload limiter (migration 023).
  // This caps both anonymous floods and logged-in abuse — videos are the
  // priciest payload, so this count cap pairs with the 25 MB size cap.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = await sha256_16(ip);
  const { error: rlErr } = await supa.rpc("record_file_upload", {
    p_ip_hash: ipHash,
    p_user_id: user?.id ?? null,
  });
  if (rlErr) {
    if (rlErr.message?.includes("rate_limit_exceeded")) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: "Too many uploads in the last hour. Try again shortly.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: rlErr.message }, { status: 400 });
  }

  // Service-role upload — the buckets have no client-write policy.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "upload_unavailable" }, { status: 503 });
  }

  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(bucket)
    .upload(path, bytes, { upsert: false, contentType: file.type });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  const asset_url = admin.storage.from(bucket).getPublicUrl(path).data
    .publicUrl;
  return NextResponse.json({
    asset_url,
    asset_size: file.size,
    asset_mime: file.type,
    asset_filename: file.name,
  });
}
