import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isSameOrigin, isUuid, requireAdmin } from "@/lib/admin";

// Shared guard for the /api/admin/* POST routes. Order matters:
//  1. requireAdmin() first, and a plain 404 for anyone else, so the
//     routes do not reveal that they exist.
//  2. Same-origin check (CSRF): the Origin header host must equal the
//     request host.
//  3. A JSON body of the form { id: <uuid> }.

export type AdminPostOk = { admin: User; id: string };

export async function guardAdminPost(request: Request): Promise<AdminPostOk | NextResponse> {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const host = request.headers.get("host");
  if (!isSameOrigin(request.headers.get("origin"), host)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (!body || !isUuid(body.id)) {
    return NextResponse.json({ error: "A valid id is required" }, { status: 400 });
  }
  return { admin, id: body.id };
}
