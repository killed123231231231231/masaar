-- 031 — Vertexa QR public/free guardrails.
-- RULE 0: purely additive or tightening for NEW writes only. No existing
-- qr_codes row is updated, deleted or re-shaped by this migration. The scan
-- path (resolve_qr_v2 / log_scan / resolve_asset_qr / get_renderable_qr) is
-- not touched.

-- ── 1. IP-limiter RPCs: server-only ────────────────────────────────────────
-- These take a caller-supplied p_ip_hash, so anon could rotate it and never be
-- limited. The Next.js routes now call them with the service role and a hash
-- computed server-side from the request IP.
revoke execute on function public.create_anon_qr(text, qr_kind, content_kind, text, jsonb, text, uuid, text, text, text, text, text, text, text) from anon, authenticated, public;
revoke execute on function public.record_anon_logo_upload(text, uuid) from anon, authenticated, public;
revoke execute on function public.record_file_upload(text, uuid) from anon, authenticated, public;
revoke execute on function public.submit_contact_request(text, text, text, text, text, text) from anon, authenticated, public;
revoke execute on function public.submit_feedback(uuid, integer, text, text, text) from anon, authenticated, public;
grant execute on function public.create_anon_qr(text, qr_kind, content_kind, text, jsonb, text, uuid, text, text, text, text, text, text, text) to service_role;
grant execute on function public.record_anon_logo_upload(text, uuid) to service_role;
grant execute on function public.record_file_upload(text, uuid) to service_role;
grant execute on function public.submit_contact_request(text, text, text, text, text, text) to service_role;
grant execute on function public.submit_feedback(uuid, integer, text, text, text) to service_role;

-- ── 2. Generic server-side rate limiter ────────────────────────────────────
create table if not exists public.rate_events (
  id bigint generated always as identity primary key,
  bucket text not null,
  subject text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup on public.rate_events (bucket, subject, created_at desc);
alter table public.rate_events enable row level security; -- no policies: service role only

create or replace function public.hit_rate_limit(p_bucket text, p_subject text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.rate_events
   where bucket = p_bucket and subject = p_subject
     and created_at > now() - make_interval(secs => p_window_seconds);
  if n >= p_max then return false; end if;
  insert into public.rate_events(bucket, subject) values (p_bucket, p_subject);
  -- opportunistic cleanup of old rows (cheap, bounded)
  delete from public.rate_events where created_at < now() - interval '2 days'
    and id in (select id from public.rate_events where created_at < now() - interval '2 days' limit 200);
  return true;
end $$;
revoke execute on function public.hit_rate_limit(text, text, int, int) from anon, authenticated, public;
grant execute on function public.hit_rate_limit(text, text, int, int) to service_role;

-- ── 3. Per-user QR quota (free plan = 25), enforced in the DB ──────────────
-- Applies to NEW inserts only. profiles.qr_quota NULL = default 25; set a
-- higher number per user (e.g. the owner account) to exempt.
alter table public.profiles add column if not exists qr_quota integer;

create or replace function public.enforce_qr_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int; q int;
begin
  if new.user_id is null then return new; end if;
  select coalesce(qr_quota, 25) into q from public.profiles where id = new.user_id;
  q := coalesce(q, 25);
  select count(*) into n from public.qr_codes where user_id = new.user_id;
  if n >= q then
    raise exception 'qr_quota_exceeded' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists trg_enforce_qr_quota on public.qr_codes;
create trigger trg_enforce_qr_quota before insert on public.qr_codes
  for each row execute function public.enforce_qr_quota();

-- profiles has an owner UPDATE policy (profiles_self_update, migration 001),
-- so without this guard any signed-in user could raise their own qr_quota
-- through the REST API and bypass the cap. Only the service role (owner
-- admin panel) or a direct DB session may change it.
create or replace function public.guard_profile_quota()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.qr_quota is distinct from old.qr_quota
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'admin_only_field' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_profile_quota on public.profiles;
create trigger trg_guard_profile_quota before update on public.profiles
  for each row execute function public.guard_profile_quota();

-- ── 4. Admin lock + immutable printed identity ─────────────────────────────
-- admin_locked: set only by the owner admin panel (service role). While locked,
-- the QR owner cannot change status/destination (abuse takedown sticks).
-- short_id and kind can never be changed by end users (they are what is
-- printed). Existing rows get admin_locked = false (default) — no behaviour change.
alter table public.qr_codes add column if not exists admin_locked boolean not null default false;

create or replace function public.guard_qr_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_setting('request.jwt.claim.role', true) = 'service_role'
     or current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;
  if new.short_id is distinct from old.short_id or new.kind is distinct from old.kind then
    raise exception 'immutable_field' using errcode = 'P0001';
  end if;
  if new.admin_locked is distinct from old.admin_locked then
    raise exception 'admin_only_field' using errcode = 'P0001';
  end if;
  if old.admin_locked and (new.status is distinct from old.status
                           or new.destination is distinct from old.destination
                           or new.content_kind is distinct from old.content_kind) then
    raise exception 'qr_locked_by_admin' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_qr_update on public.qr_codes;
create trigger trg_guard_qr_update before update on public.qr_codes
  for each row execute function public.guard_qr_update();

-- ── 5. Upload caps for NEW files (existing files are untouched) ────────────
update storage.buckets set file_size_limit = 5242880  where id = 'qr-pdfs';   -- 5 MB
update storage.buckets set file_size_limit = 2097152  where id = 'qr-images'; -- 2 MB
-- No new video uploads on the free plan (existing videos keep streaming).
update storage.buckets set allowed_mime_types = array['application/x-vertexa-disabled'] where id = 'qr-videos';
update storage.buckets set file_size_limit = 524288,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'] where id = 'logos'; -- 500 KB, no SVG
