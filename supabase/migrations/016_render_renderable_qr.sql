-- B7/P1-1 — render.png used the service-role admin client, bypassing
-- RLS: anyone with a QR's UUID could fetch its PNG, and for STATIC QRs
-- the encoded `destination` is the full content (a wifi/vCard QR leaks
-- its payload). Close the bypass with a SECURITY DEFINER reader that
-- returns ONLY render fields, ONLY for rows safe to expose: status
-- 'active' (already public via /r/<short_id>) OR the calling owner (any
-- status, for dashboard thumbnails of drafts). The route uses the
-- cookie-aware client so auth.uid() is the owner when present and NULL
-- for the unauthenticated welcome-email <img> (which always renders an
-- already-active QR — see /api/checkout/anon).
create or replace function public.get_renderable_qr(p_id uuid)
returns table (
  short_id    text,
  kind        text,
  destination text,
  fg_color    text,
  bg_color    text,
  name        text,
  logo_url    text,
  status      text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select q.short_id,
         q.kind::text,
         q.destination,
         q.fg_color,
         q.bg_color,
         q.name,
         q.logo_url,
         q.status::text
  from public.qr_codes q
  where q.id = p_id
    and (q.status = 'active' or q.user_id = (select auth.uid()))
  limit 1;
$$;

revoke execute on function public.get_renderable_qr(uuid) from public;
grant  execute on function public.get_renderable_qr(uuid) to anon, authenticated;
