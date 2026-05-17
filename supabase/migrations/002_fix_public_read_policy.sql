-- ============================================================
-- Masaar — 002: lock down public QR read + safe redirect resolver
--
-- Fixes audit finding S1. The broad `qr_codes_public_read_active`
-- policy (FOR SELECT USING is_active = true) was OR-combined with
-- `qr_codes_owner_all`, so:
--   * owner-scoped list queries returned EVERY user's active QR, and
--   * anyone holding the public anon key could read password_hash and
--     payload_json (WiFi passwords / vCard PII) for all active QRs.
--
-- We remove that policy entirely. The only thing that legitimately
-- needs unauthenticated read is the /r/[shortId] redirect, and it
-- only needs (id, destination) for active rows — so we expose exactly
-- that through a SECURITY DEFINER function instead of a table policy.
-- ============================================================

-- 1. Remove the over-permissive public SELECT policy.
drop policy if exists "qr_codes_public_read_active" on public.qr_codes;

-- 2. Minimal resolver for the redirect handler. SECURITY DEFINER so it
--    reads past RLS, but it only ever returns the two columns the
--    redirect needs, and only for active rows.
create or replace function public.resolve_qr(p_short_id text)
returns table (id uuid, destination text)
language sql
security definer
set search_path = public
as $$
  select q.id, q.destination
  from public.qr_codes q
  where q.short_id = p_short_id
    and q.is_active = true
  limit 1;
$$;

revoke all on function public.resolve_qr(text) from public;
grant execute on function public.resolve_qr(text) to anon, authenticated;
