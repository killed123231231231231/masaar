import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/env";

// Server-side PNG render for the welcome email's <img>. qr-code-styling
// is DOM-bound; `qrcode` is zero-DOM. v1 = plain QR with the row's
// configured colors (frames/logos are Session I). Node runtime.
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "render unavailable" }, { status: 503 });
  }

  const { data: qr } = await supabase
    .from("qr_codes")
    .select("short_id, kind, destination, fg_color, bg_color, name")
    .eq("id", id)
    .maybeSingle();

  if (!qr) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data =
    qr.kind === "dynamic" && qr.short_id
      ? `${appUrl()}/r/${qr.short_id}`
      : qr.destination || " ";

  const url = new URL(_req.url);
  const sizeParam = Number(url.searchParams.get("size"));
  const width = Math.min(1024, Math.max(128, sizeParam || 512));
  const wantsDownload = url.searchParams.get("download") === "1";

  const buf = await QRCode.toBuffer(data, {
    width,
    margin: 1,
    color: {
      dark: qr.fg_color || "#000000",
      light: qr.bg_color || "#FFFFFF",
    },
  });

  const safeName = (qr.name || "masaar-qr")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .slice(0, 60);
  const filename = `${safeName}-${qr.short_id || id.slice(0, 8)}.png`;

  return new Response(new Uint8Array(buf), {
    headers: {
      "content-type": "image/png",
      "cache-control": wantsDownload ? "no-store" : "public, max-age=300",
      ...(wantsDownload
        ? { "content-disposition": `attachment; filename="${filename}"` }
        : {}),
    },
  });
}
