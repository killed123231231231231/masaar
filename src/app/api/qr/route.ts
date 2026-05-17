import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShortId } from "@/lib/shortid";
import { parseHttpUrl } from "@/lib/url";
import type { QrCode } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const insert: Partial<QrCode> = {
    user_id: user.id,
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
  };

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
    insert.short_id = generateShortId();
  }

  const { data, error } = await supabase
    .from("qr_codes")
    .insert(insert)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { id, ...patch } = body;
  // user_id and short_id can never be patched
  delete patch.user_id;
  delete patch.short_id;

  const { data, error } = await supabase
    .from("qr_codes")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
