import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// B5/Fix 21 — anon logo upload. Anon users complete the wizard end-to-end
// including custom logos; the only gate is payment. File lands in the
// existing public `logos` bucket under `anon/<draft_token>/<uuid>.<ext>`
// via the service-role admin client (no anon-write storage policy
// needed). 500 KB / png|jpg|svg limit; 5-uploads-per-hour-per-IP via
// the record_anon_logo_upload SECURITY DEFINER RPC (migration 012).

const MAX_BYTES = 500 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/svg+xml"]);
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

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/svg+xml") return "svg";
  return "bin";
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const draftToken = form.get("draft_token");
  if (typeof draftToken !== "string" || !UUID_RE.test(draftToken)) {
    return NextResponse.json(
      { error: "draft_token_required" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "unsupported_mime", message: "PNG, JPG or SVG only." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "too_large", message: "Logo must be under 500 KB." },
      { status: 413 }
    );
  }

  // Rate-limit by IP via the SECURITY DEFINER RPC. Uses the regular
  // server client (RPC is anon-grant-execute) — doesn't need the
  // admin client.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0";
  const ipHash = await sha256_16(ip);

  const supa = await createClient();
  const { error: rlErr } = await supa.rpc("record_anon_logo_upload", {
    p_ip_hash: ipHash,
    p_draft_token: draftToken,
  });
  if (rlErr) {
    if (rlErr.message?.includes("rate_limit_exceeded")) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: "Too many logo uploads from this network. Try again in an hour.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: rlErr.message }, { status: 400 });
  }

  // Storage upload via service-role admin client — bypasses anon-write
  // RLS so we don't need a public-anon-INSERT policy on storage.objects.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "render_unavailable" },
      { status: 503 }
    );
  }

  const ext = extFromMime(file.type);
  const path = `anon/${draftToken}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from("logos")
    .upload(path, bytes, {
      upsert: false,
      contentType: file.type,
    });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  const url = admin.storage.from("logos").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url, path });
}
