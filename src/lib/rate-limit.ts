import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generic server-side rate limiter backed by the hit_rate_limit RPC
 * (migration 031). SERVER ONLY.
 *
 * Fails OPEN: if the service key is missing, the RPC doesn't exist yet
 * (code ships before 031 is applied) or the call errors, the request is
 * allowed and a warning is logged. A limiter outage must never take the
 * product down.
 */
export type RateLimitResult = { ok: boolean };

export async function rateLimit(
  bucket: string,
  subject: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient();
    // hit_rate_limit isn't in the hand-written Database types yet.
    const rpc = admin.rpc.bind(admin) as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
    const { data, error } = await rpc("hit_rate_limit", {
      p_bucket: bucket,
      p_subject: subject,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.warn(`[rate-limit] ${bucket}: limiter unavailable, allowing (${error.message ?? "error"})`);
      return { ok: true };
    }
    return { ok: data !== false };
  } catch (e) {
    console.warn(`[rate-limit] ${bucket}: limiter unavailable, allowing (${String(e)})`);
    return { ok: true };
  }
}

export function rateLimitedResponse() {
  return NextResponse.json(
    { error: "rate_limited", message: "Too many requests. Please try again later." },
    { status: 429 }
  );
}
