import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { supabaseUrl, supabaseAnonKey } from "@/lib/env";

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
