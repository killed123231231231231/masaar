import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cheap "has anything new been scanned?" fingerprint for the signed-in
 * owner: the id of their most recent scan. RLS (`scans_owner_read`) scopes
 * the read to the caller's own QRs, so no user filter is needed. Returns
 * "none" when they have no scans (or the read fails — callers then simply
 * treat it as unchanged).
 */
export async function latestScanVersion(
  supabase: SupabaseClient<Database>
): Promise<string> {
  const { data } = await supabase
    .from("scans")
    .select("id")
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ? String(data.id) : "none";
}
