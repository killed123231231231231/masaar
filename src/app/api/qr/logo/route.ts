import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitedResponse } from "@/lib/rate-limit";
import { bytesMatchImageMime } from "@/lib/image-sniff";

export const runtime = "nodejs";

// Signed-in logo upload (security audit #9). Signed-in users used to upload
// straight to the public `logos` bucket from the browser, so a script could
// upload unlimited files. Uploads now go through here: same 500 KB and
// PNG/JPG/WebP rules as the anonymous route, a real-image byte check, and
// 20 uploads per hour per account. Files land at logos/<user id>/<uuid>.<ext>
// via the service role (the direct storage policies are dropped in 032).

const MAX_BYTES = 500 * 1024;
const MULTIPART_OVERHEAD = 16 * 1024;
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const len = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(len) && len > MAX_BYTES + MULTIPART_OVERHEAD) {
    return NextResponse.json(
      { error: "too_large", message: "Logo must be under 500 KB." },
      { status: 413 }
    );
  }

  if (!(await rateLimit("logo_upload_user", user.id, 20, 3600)).ok) {
    return rateLimitedResponse();
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
  const ext = EXT[file.type];
  if (!ext) {
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
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytesMatchImageMime(bytes, file.type)) {
    return NextResponse.json(
      { error: "unsupported_mime", message: "That file isn't a real PNG, JPG or WebP image." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "upload_unavailable" }, { status: 503 });
  }
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage
    .from("logos")
    .upload(path, bytes, { upsert: false, contentType: file.type });
  if (upErr) {
    console.error("[logo upload]", upErr.message);
    return NextResponse.json(
      { error: "upload_failed", message: "Couldn’t upload the logo. Please try again." },
      { status: 400 }
    );
  }
  const url = admin.storage.from("logos").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url, path });
}
