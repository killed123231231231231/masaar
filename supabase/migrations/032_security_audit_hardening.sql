-- 032 — security audit hardening (2026-11-25).
-- RULE 0: tightening only. No qr_codes row is inserted, updated or deleted
-- by this migration. Printed dynamic QRs keep resolving: /r still calls
-- resolve_qr_v2 with the public key and still gets the destination of every
-- ACTIVE, unprotected dynamic QR, exactly as before.
-- App code deployed first (291b045): writes, logo uploads, /v and scan
-- logging no longer depend on the grants revoked here.

-- ── 1. Resolvers stop leaking destinations ─────────────────────────────────
-- Only an active, unlocked, password-free DYNAMIC QR gets its destination;
-- everything else gets NULL plus the flags /r needs to route (status,
-- has_password). Static rows still resolve (so /r keeps its old routing for
-- them, e.g. pending → /activate, verified by the printed-QR baseline) but
-- never get a destination: a static QR encodes its content directly.
create or replace function public.resolve_qr_v2(p_short_id text)
returns table(id uuid, destination text, status text, content_type text, has_password boolean)
language sql stable security definer set search_path to 'public', 'pg_temp'
as $$
  select q.id,
         case
           when q.kind = 'dynamic'
            and q.status = 'active'
            and q.password_hash is null
            and not coalesce(q.admin_locked, false)
           then q.destination
         end,
         q.status::text,
         q.content_kind::text,
         (q.password_hash is not null)
  from public.qr_codes q
  where q.short_id = p_short_id
  limit 1;
$$;
grant execute on function public.resolve_qr_v2(text) to anon, authenticated;

-- Legacy resolver (unused by the app) and the file resolver (the /v page
-- now reads server-side) are no longer callable with the public key.
revoke execute on function public.resolve_qr(text) from anon, authenticated, public;
revoke execute on function public.resolve_asset_qr(text) from anon, authenticated, public;
grant execute on function public.resolve_qr(text) to service_role;
grant execute on function public.resolve_asset_qr(text) to service_role;

-- ── 2. Scan logging is server-only ─────────────────────────────────────────
-- /r logs with the service role; nobody can write fake scans directly.
revoke execute on function public.log_scan(uuid, text, text, text, text, text, text, text, text)
  from anon, authenticated, public;
grant execute on function public.log_scan(uuid, text, text, text, text, text, text, text, text)
  to service_role;

-- ── 3. QR rows are written only through the app's server routes ────────────
-- Owners keep SELECT and DELETE (policy qr_codes_owner_all + guard_qr_delete);
-- INSERT/UPDATE now go through /api/qr with the service role, where the
-- destination safety, file-storage and status rules run.
revoke insert, update on public.qr_codes from anon, authenticated;

-- ── 4. Profiles: users may only edit their display fields ──────────────────
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- ── 5. Logos: no direct browser uploads (now via /api/qr/logo) ─────────────
drop policy if exists logos_owner_upload on storage.objects;
drop policy if exists logos_owner_update on storage.objects;

-- ── 6. Deleted short codes are retired for good ────────────────────────────
-- A printed QR that its owner deletes must never be re-registered by
-- someone else to catch its scans. Locked rows still can't be deleted by
-- their owner (unchanged).
-- SECURITY DEFINER so an owner's delete can write retired_short_ids (no
-- client policies). Inside a definer current_user is the owner, so the
-- caller is identified by the request's JWT role instead: end users are
-- 'authenticated'/'anon'; the service role and direct DB sessions are not.
create or replace function public.guard_qr_delete()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_role text;
begin
  v_role := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    nullif(current_setting('request.jwt.claim.role', true), ''),
    '');
  if old.admin_locked and v_role in ('authenticated', 'anon') then
    raise exception 'qr_locked_by_admin' using errcode = 'P0001';
  end if;
  if old.short_id is not null then
    insert into public.retired_short_ids(short_id) values (old.short_id)
      on conflict (short_id) do nothing;
  end if;
  return old;
end $$;

-- ── 7. search_path hygiene on definer/trigger functions ────────────────────
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c = 'search_path=public')
  loop
    execute format('alter function %s set search_path = public, pg_temp', r.sig);
  end loop;
end $$;
