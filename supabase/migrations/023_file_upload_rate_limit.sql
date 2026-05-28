-- C/anti-abuse — dedicated file-upload limiter (replaces the reused logo
-- limiter for the file buckets) + tighter video size cap.
--
-- (1) lower the video cap 50MB -> 25MB at the storage layer (the route
-- mirrors this). A scan->watch clip should be short; 25MB ~ 1 min of
-- mobile-friendly 720p and halves the worst-case per-file cost.
update storage.buckets set file_size_limit = 26214400 where id = 'qr-videos';

-- (2) per-identity upload counter. Counts by IP always, and by user when
-- authed, over a rolling hour. Written only via the SECURITY DEFINER RPC.
create table if not exists public.file_uploads (
  id         bigint generated always as identity primary key,
  user_id    uuid,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index if not exists file_uploads_ip_created_idx   on public.file_uploads (ip_hash, created_at desc);
create index if not exists file_uploads_user_created_idx on public.file_uploads (user_id, created_at desc);
alter table public.file_uploads enable row level security;
-- no policies: write-only via record_file_upload(), readable by service role.

create or replace function public.record_file_upload(p_ip_hash text, p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit constant int := 10;  -- uploads / hour / identity (per IP and per user)
  v_count int;
begin
  -- per-IP cap (always)
  select count(*) into v_count
  from public.file_uploads
  where ip_hash = p_ip_hash and created_at > now() - interval '1 hour';
  if v_count >= v_limit then
    raise exception 'rate_limit_exceeded';
  end if;

  -- per-user cap (when authenticated)
  if p_user_id is not null then
    select count(*) into v_count
    from public.file_uploads
    where user_id = p_user_id and created_at > now() - interval '1 hour';
    if v_count >= v_limit then
      raise exception 'rate_limit_exceeded';
    end if;
  end if;

  insert into public.file_uploads (user_id, ip_hash) values (p_user_id, p_ip_hash);
end;
$$;

revoke execute on function public.record_file_upload(text, uuid) from public;
grant  execute on function public.record_file_upload(text, uuid) to anon, authenticated;
