-- Session I — Pro customization & protection. password_hash, frame_style,
-- frame_text already exist (scaffolded); add the rest + unlock plumbing.
alter table public.qr_codes
  add column if not exists password_set_at  timestamptz,
  add column if not exists frame_color      text,
  add column if not exists text_color       text,
  add column if not exists corner_dot_shape text,
  add column if not exists logo_scale       numeric(3,2);

-- Unlock-attempt log → rate-limit + lockout for password-protected QRs.
create table if not exists public.unlock_attempts (
  id           bigint generated always as identity primary key,
  short_id     text not null,
  ip_hash      text not null,
  ok           boolean not null default false,
  attempted_at timestamptz not null default now()
);
create index if not exists unlock_attempts_short_ip_idx
  on public.unlock_attempts (short_id, ip_hash, attempted_at desc);
alter table public.unlock_attempts enable row level security;  -- service-role only

-- /r runs on the edge and can't read password_hash — expose a boolean so
-- the resolver tells it when to send a scan to /unlock first. Return-type
-- change ⇒ drop+create (atomic in this migration); re-granted to anon.
drop function if exists public.resolve_qr_v2(text);
create function public.resolve_qr_v2(p_short_id text)
 returns table(id uuid, destination text, status text, content_type text, has_password boolean)
 language sql stable security definer set search_path to 'public','pg_temp'
as $$
  select q.id, q.destination, q.status::text, q.content_kind::text,
         (q.password_hash is not null)
  from public.qr_codes q where q.short_id = p_short_id limit 1;
$$;
grant execute on function public.resolve_qr_v2(text) to anon, authenticated;
