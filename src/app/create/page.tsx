import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SidebarMe } from "@/components/dashboard/sidebar";
import WizardClient from "./wizard-client";

// The 3-step builder wizard (replaces the legacy single-page builder).
// Auth state decides anon-funnel vs owned create; the wizard feeds the
// SAME Session A save flow. useSearchParams in the wizard → Suspense.
// B5/Item 6 — authed users now see the wizard wrapped in the deep-teal
// Sidebar shell so the sidebar stays locked across every authed
// surface. Anon users still see the bare wizard layout.
export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let me: SidebarMe | null = null;
  if (user) {
    const [profileRes, qrCountRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, subscription_status")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("qr_codes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);
    me = {
      email: user.email ?? "",
      name: profileRes.data?.full_name ?? user.email ?? "Account",
      plan: profileRes.data?.subscription_status === "active" ? "Pro" : "Free",
      qrCount: qrCountRes.count ?? 0,
    };
  }

  return (
    <Suspense fallback={null}>
      <WizardClient isAuthed={!!user} me={me} />
    </Suspense>
  );
}
