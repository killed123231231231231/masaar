import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ipHash as hashRequestIp } from "@/lib/ip-hash";
import { bytesMatchImageMime } from "@/lib/image-sniff";

export const runtime = "nodejs";

// B5/Fix 21 — anon logo upload. Anon users complete the wizard end-to-end
// including custom logos; the only gate is payment. File lands in the
// existing public `logos` bucket under `anon/<draft_token>/<uuid>.<ext>`
// via the service-role admin client (no anon-write storage policy
// needed). 500 KB / png|jpg|webp limit; 5-uploads-per-hour-per-IP via
// the record_anon_logo_upload SECURITY DEFINER RPC (migration 012).
// SVG is rejected: `logos` is a public bucket, and an SVG served from it
// can carry script (stored XSS). Migration 031 sets the same bucket rule.

const MAX_BYTES = 500 * 1024;
const MULTIPART_OVERHEAD = 16 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export async function POST(request: Request) {
  // Reject oversized bodies before buffering the multipart payload.
  const len = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(len) && len > MAX_BYTES + MULTIPART_OVERHEAD) {
    return NextResponse.json(
      { error: "too_large", message: "Logo must be under 500 KB." },
      { status: 413 }
    );
  }

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
      { error: "unsupported_mime", message: "PNG, JPG or WebP only." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "too_large", message: "Logo must be under 500 KB." },
      { status: 413 }
    );
  }

  // The MIME type is client-supplied: check the file really is that image.
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!bytesMatchImageMime(head, file.type)) {
    return NextResponse.json(
      { error: "unsupported_mime", message: "That file isn't a real PNG, JPG or WebP image." },
      { status: 400 }
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
    console.error("[upload]", rlErr.message);
    return NextResponse.json({ error: "upload_failed", message: "Couldn’t upload the file. Please try again." }, { status: 400 });
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
    console.error("[upload]", upErr.message);
    return NextResponse.json({ error: "upload_failed", message: "Couldn’t upload the file. Please try again." }, { status: 400 });
  }

  const url = admin.storage.from("logos").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url, path });
}
