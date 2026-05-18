import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import WizardClient from "./wizard-client";

// The 3-step builder wizard (replaces the legacy single-page builder).
// Auth state decides anon-funnel vs owned create; the wizard feeds the
// SAME Session A save flow. useSearchParams in the wizard → Suspense.
export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Suspense fallback={null}>
      <WizardClient isAuthed={!!user} />
    </Suspense>
  );
}
