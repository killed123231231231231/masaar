// B5/Round2 C1 — cached `me` lookup for the dashboard's Sidebar chip
// + plan card. Profile + qrCount were re-fetched on every dashboard
// navigation (Overview, qr-codes, edit, analytics, activity, menu,
// settings, authed-create — 8 surfaces). Each was ~150-300ms of
// sequential round-trips on top of the page's own data fetches,
// contributing to Audit C1's 2-second nav transitions.
//
// unstable_cache wraps the fetch with a 60s revalidation window keyed
// by user.id. First nav pays the cost; the next 60s of navigations
// across all 8 surfaces return from cache instantly.
//
// Uses the admin client INSIDE the cached function because the per-
// request server client carries cookies that change per request —
// caching that would leak across users. The admin client is stateless;
// the query is explicitly scoped by user.id so RLS isn't material.

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MeBundle {
  email: string;
  name: string;
  plan: string;   // "Pro" | "Free"
  qrCount: number;
}

async function fetchMeUncached(userId: string, email: string): Promise<MeBundle> {
  const admin = createAdminClient();
  const [profileRes, qrCountRes] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, subscription_status")
      .eq("id", userId)
      .maybeSingle(),
    admin
      .from("qr_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  return {
    email,
    name: profileRes.data?.full_name ?? email ?? "Account",
    plan: profileRes.data?.subscription_status === "active" ? "Pro" : "Free",
    qrCount: qrCountRes.count ?? 0,
  };
}

/**
 * Get the current user's sidebar profile + qrCount. 60-second TTL
 * keyed by user.id so navigations across the 8 dashboard surfaces
 * share one cached result.
 */
export const getMe = unstable_cache(
  async (userId: string, email: string) => fetchMeUncached(userId, email),
  ["me-bundle"],
  { revalidate: 60, tags: ["me"] }
);
