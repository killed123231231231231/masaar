import { NextResponse } from "next/server";
import { guardAdminPost } from "@/lib/admin-route";
import { setQrLock } from "@/lib/admin-qr";

export const dynamic = "force-dynamic";

// Owner action: lock a QR code (admin_locked = true, status = suspended,
// previous status saved in admin_prev_status). Needs migration 031.
export async function POST(request: Request) {
  const guard = await guardAdminPost(request);
  if (guard instanceof NextResponse) return guard;

  const result = await setQrLock(guard.id, true);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
