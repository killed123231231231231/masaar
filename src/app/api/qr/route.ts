import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShortId, isValidShortId } from "@/lib/shortid";
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
    // Trust the client-generated shortId only if it's well-formed (so the
    // printed/previewed QR matches what we persist); otherwise generate.
    // The DB unique constraint still guards against collisions.
    insert.short_id = isValidShortId(body.short_id)
      ? body.short_id
      : generateShortId();
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

  // Explicit allow-list. Spreading the request body let a client set any
  // column (kind, is_active, password_hash, payload_json, created_at, ...).
  // Only the two fields the edit UI actually changes are patchable.
  const patch: Partial<QrCode> = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.destination === "string") patch.destination = body.destination;

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
