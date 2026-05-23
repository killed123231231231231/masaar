-- Sprint 2 Session B.5 Fix 21: anon-friendly logo upload rate limit.
-- Anon users now upload logos via /api/qr/anonymous/logo which calls
-- this RPC to enforce a 5-uploads-per-hour-per-IP cap server-side.
-- Tracking table is service-role-only — anon never reads or writes
-- directly. Additive only.

create table if not exists public.anon_logo_uploads (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  draft_token uuid,
  created_at timestamptz not null default now()
);

alter table public.anon_logo_uploads enable row level security;
-- No policies = no direct anon/authenticated access. Inserts happen
-- through the SECURITY DEFINER RPC below; reads (if ever needed for
-- abuse analysis) go through the service role.

create index if not exists anon_logo_uploads_ip_hash_idx
  on public.anon_logo_uploads (ip_hash, created_at desc);

create or replace function public.record_anon_logo_upload(
  p_ip_hash text,
  p_draft_token uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  if p_ip_hash is null then
    raise exception 'ip_hash_required';
  end if;
  select count(*) into recent_count
    from public.anon_logo_uploads
   where ip_hash = p_ip_hash
     and created_at > now() - interval '1 hour';
  if recent_count >= 5 then
    raise exception 'rate_limit_exceeded';
  end if;
  insert into public.anon_logo_uploads (ip_hash, draft_token)
  values (p_ip_hash, p_draft_token);
  return true;
end;
$$;

revoke all on function public.record_anon_logo_upload(text, uuid) from public;
grant execute on function public.record_anon_logo_upload(text, uuid)
  to anon, authenticated;
