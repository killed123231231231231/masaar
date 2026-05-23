-- Sprint 2 Session B.5 Item 3: /contact page submissions.
-- Table + SECURITY DEFINER RPC so anon visitors can submit without us
-- granting them direct INSERT (which would let them flood the table or
-- spoof other people's submissions). Per-IP rate limit (3/hr) reusing
-- the ip_hash pattern from /api/qr/anonymous. Additive only.

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  preferred_time text,
  submitted_at timestamptz not null default now(),
  submitter_ip_hash text
);

-- RLS on, NO policies = no direct access for anon/authenticated.
-- All writes go through submit_contact_request below; reads are
-- service-role only (admin client, internal tooling).
alter table public.contact_requests enable row level security;

create index if not exists contact_requests_submitted_at_idx
  on public.contact_requests (submitted_at desc);
create index if not exists contact_requests_ip_hash_idx
  on public.contact_requests (submitter_ip_hash, submitted_at desc);

create or replace function public.submit_contact_request(
  p_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_preferred_time text,
  p_ip_hash text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count int;
begin
  -- Required fields (defense-in-depth — the API route also validates).
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name_required';
  end if;
  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'email_required';
  end if;
  if p_message is null or length(trim(p_message)) = 0 then
    raise exception 'message_required';
  end if;

  -- Approximate per-IP rate limit: 3 submissions per hour. CAPTCHA
  -- is a Sprint 3 hardening item (logged to BACKLOG).
  if p_ip_hash is not null then
    select count(*) into recent_count
      from public.contact_requests
     where submitter_ip_hash = p_ip_hash
       and submitted_at > now() - interval '1 hour';
    if recent_count >= 3 then
      raise exception 'rate_limit_exceeded';
    end if;
  end if;

  insert into public.contact_requests (
    name, email, phone, message, preferred_time, submitter_ip_hash
  ) values (
    trim(p_name),
    lower(trim(p_email)),
    nullif(trim(p_phone), ''),
    trim(p_message),
    nullif(trim(p_preferred_time), ''),
    p_ip_hash
  );

  return true;
end;
$$;

revoke all on function public.submit_contact_request(text, text, text, text, text, text) from public;
grant execute on function public.submit_contact_request(text, text, text, text, text, text)
  to anon, authenticated;
