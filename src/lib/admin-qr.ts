import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { qrCacheSet, toCachedQr } from "@/lib/qr-edge-cache";
import type { QrCode } from "@/types/database";

// Owner lock/unlock for a single QR code, run only when the owner clicks
// the button in /admin. Only `status` and `admin_locked` change. short_id,
// destination, content and files are never touched, so an unlocked QR
// scans exactly as before. A locked (suspended) QR lands on /expired, the
// same as a QR its owner switched off.
//
// The admin_locked column may not exist yet (it ships in a separate,
// additive migration). The row is read with select("*") first: without
// the column, lock/unlock fall back to changing status only.

export type LockResult =
  | { ok: true; lockColumn: boolean }
  | { ok: false; status: number; error: string };

type Row = QrCode & { admin_locked?: boolean | null };

export async function setQrLock(id: string, lock: boolean): Promise<LockResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("qr_codes").select("*").eq("id", id).maybeSingle();
  if (error) return { ok: false, status: 500, error: error.message };
  if (!data) return { ok: false, status: 404, error: "QR code not found" };

  const row = data as Row;
  const lockColumn = Object.prototype.hasOwnProperty.call(row, "admin_locked");

  if (lock) {
    // Drafts and unpaid QRs are workflow states; locking them would let a
    // later unlock flip them straight to active.
    if (row.status !== "active" && row.status !== "suspended") {
      return { ok: false, status: 409, error: "Only active or suspended QR codes can be locked." };
    }
    if (lockColumn && row.admin_locked === true) return { ok: true, lockColumn };
  } else {
    const locked = lockColumn ? row.admin_locked === true : row.status === "suspended";
    if (!locked) {
      return { ok: false, status: 409, error: "This QR code is not locked." };
    }
  }

  const patch: Record<string, unknown> = { status: lock ? "suspended" : "active" };
  if (lockColumn) patch.admin_locked = lock;

  const { data: updated, error: updateError } = await supabase
    .from("qr_codes")
    .update(patch as unknown as Partial<QrCode>)
    .eq("id", id)
    .select()
    .single();
  if (updateError) return { ok: false, status: 500, error: updateError.message };

  // Keep the /r edge cache in step so the change applies on the next scan.
  const fresh = updated as QrCode | null;
  if (fresh?.short_id) {
    const sid = fresh.short_id;
    after(async () => qrCacheSet(sid, toCachedQr(fresh)));
  }
  return { ok: true, lockColumn };
}
