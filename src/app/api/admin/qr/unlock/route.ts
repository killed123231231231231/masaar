import { NextResponse } from "next/server";
import { guardAdminPost } from "@/lib/admin-route";
import { setQrLock } from "@/lib/admin-qr";

export const dynamic = "force-dynamic";

// Owner action: unlock a QR code locked from /admin (admin_locked = false, status = active).
export async function POST(request: Request) {
  const guard = await guardAdminPost(request);
  if (guard instanceof NextResponse) return guard;

  const result = await setQrLock(guard.id, false);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, lockColumn: result.lockColumn });
}
