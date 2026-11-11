import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { latestScanVersion } from "@/lib/scan-version";

// Polled every few seconds by the dashboard (useLiveRefresh) so a new scan
// shows up almost instantly. Returns only an opaque version string — the
// dashboard re-renders (router.refresh) only when it changes, so the heavy
// analytics queries run once per new scan instead of on every tick.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const v = await latestScanVersion(supabase);
  return NextResponse.json(
    { v },
    { headers: { "Cache-Control": "no-store" } }
  );
}
