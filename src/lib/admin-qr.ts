import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { qrCacheSet, toCachedQr } from "@/lib/qr-edge-cache";
import type { QrCode } from "@/types/database";
import { statusAfterUnlock } from "@/lib/admin";

// Owner lock/unlock for a single QR code, run only when the owner clicks
// the button in /admin. Only `status`, `admin_locked` and
// `admin_prev_status` change. short_id, destination, content and files are
// never touched. A locked QR is status 'suspended', so scans land on
// /expired, the same as a QR its owner switched off.
//
// The lock needs migration 031 (admin_locked + admin_prev_status and the
// trigger that stops owners from editing a locked row). Until it is
// applied, both actions refuse with 409 instead of falling back to
// status alone: a status-only "lock" could not be told apart from an
// owner pause, and the owner could undo it.
//
// Unlock restores the status saved at lock time, so a QR its owner had
// paused stays paused. It never switches a QR on that was off before.

export type LockResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

type Row = QrCode & { admin_locked?: boolean | null; admin_prev_status?: string | null };

export const LOCK_MIGRATION_MISSING =
  "The admin lock needs database migration 031 before it can be used.";

export async function setQrLock(id: string, lock: boolean): Promise<LockResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("qr_codes").select("*").eq("id", id).maybeSingle();
  if (error) return { ok: false, status: 500, error: error.message };
  if (!data) return { ok: false, status: 404, error: "QR code not found" };

  const row = data as Row;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(row, k);
  if (!has("admin_locked") || !has("admin_prev_status")) {
    return { ok: false, status: 409, error: LOCK_MIGRATION_MISSING };
  }
  const isLocked = row.admin_locked === true;

  let patch: Record<string, unknown>;
  if (lock) {
    if (isLocked) return { ok: true };
    // Drafts and unpaid QRs are workflow states and are never locked.
    if (row.status !== "active" && row.status !== "suspended") {
      return { ok: false, status: 409, error: "Only active or inactive QR codes can be locked." };
    }
    patch = { status: "suspended", admin_locked: true, admin_prev_status: row.status };
  } else {
    if (!isLocked) return { ok: false, status: 409, error: "This QR code is not locked." };
    patch = {
      status: statusAfterUnlock(row.admin_prev_status),
      admin_locked: false,
      admin_prev_status: null,
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("qr_codes")
    .update(patch as unknown as Partial<QrCode>)
    .eq("id", id)
    // Only write if the row has not changed since it was read, so a
    // concurrent owner toggle cannot leave a stale admin_prev_status.
    .eq("status", row.status)
    .select()
    .maybeSingle();
  if (updateError) return { ok: false, status: 500, error: updateError.message };
  if (!updated) {
    return { ok: false, status: 409, error: "The QR code changed while saving. Reload and try again." };
  }

  // Keep the /r edge cache in step so the change applies on the next scan.
  const fresh = updated as QrCode | null;
  if (fresh?.short_id) {
    const sid = fresh.short_id;
    after(async () => qrCacheSet(sid, toCachedQr(fresh)));
  }
  return { ok: true };
}
