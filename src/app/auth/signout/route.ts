import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 forces the browser to GET "/" after this POST. The default
  // NextResponse.redirect status (307) preserves POST, which the
  // GET-only landing route rejects with a 405 error page.
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
