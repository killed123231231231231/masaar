/**
 * Origin to put in Supabase auth email links (reset, magic link). The site
 * is served on www.quickqrcode.live, but Supabase's redirect allow-list holds
 * https://quickqrcode.live/** (no www), so a www link was silently replaced
 * by the bare Site URL and the user lost the target page. The apex redirects
 * to www with the path and query intact, so links built on the apex work.
 * Browser only.
 */
export function authEmailOrigin(): string {
  const { hostname, origin } = window.location;
  if (hostname === "www.quickqrcode.live") return "https://quickqrcode.live";
  return origin;
}
