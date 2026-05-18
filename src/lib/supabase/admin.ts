import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseUrl } from "@/lib/env";

/**
 * Service-role Supabase client. SERVER ONLY — never import into a
 * client component. Bypasses RLS; used for admin user creation and
 * privileged reads (anon checkout, server-side QR render).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set (required for admin operations)."
    );
  }
  return createClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
