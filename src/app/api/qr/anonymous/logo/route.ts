import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ipHash as hashRequestIp } from "@/lib/ip-hash";

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

  // Rate-limit by IP via the SECURITY DEFINER RPC, called with the service
  // role and a server-computed hash (migration 031 revokes anon execute).
  const ipHash = await hashRequestIp(request);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "upload_unavailable" }, { status: 503 });
  }
  const { error: rlErr } = await admin.rpc("record_anon_logo_upload", {
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

  // Storage upload via the same service-role client — bypasses anon-write
  // RLS so we don't need a public-anon-INSERT policy on storage.objects.

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
