-- Session D schema. Social profile + feedback config ride in the existing
-- qr_codes.payload_json; only location gets dedicated coordinate columns.

alter table public.qr_codes
  add column if not exists latitude       numeric(10,7),
  add column if not exists longitude      numeric(10,7),
  add column if not exists location_label text;

-- Feedback submissions (one row per scan-submitted rating).
create table if not exists public.feedback_responses (
  id                uuid primary key default gen_random_uuid(),
  qr_code_id        uuid not null references public.qr_codes(id) on delete cascade,
  rating            int  not null check (rating between 1 and 5),
  comment           text,
  email             text,
  submitted_at      timestamptz not null default now(),
  submitter_ip_hash text
);
create index if not exists feedback_responses_qr_submitted_idx
  on public.feedback_responses (qr_code_id, submitted_at desc);

alter table public.feedback_responses enable row level security;
drop policy if exists feedback_responses_owner_read on public.feedback_responses;
create policy feedback_responses_owner_read on public.feedback_responses
  for select to authenticated
  using (exists (select 1 from public.qr_codes q
                 where q.id = feedback_responses.qr_code_id and q.user_id = auth.uid()));
-- No anon SELECT / INSERT policy: submissions go ONLY through submit_feedback().

-- Waitlist for the Payment placeholder. Service-role writes only.
create table if not exists public.waitlist_signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text not null default 'payment_qr',
  created_at timestamptz not null default now()
);
alter table public.waitlist_signups enable row level security;  -- no policies; service-role only

-- Rate-limited feedback insert (anti-bot backstop 8/hour per IP per QR).
-- Mirrors record_file_upload; definer bypasses RLS to check + insert.
create or replace function public.submit_feedback(
  p_qr_code_id uuid, p_rating int, p_comment text, p_email text, p_ip_hash text
) returns void language plpgsql security definer set search_path = 'public','pg_temp' as $$
declare v_recent int;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'invalid rating'; end if;
  if not exists (select 1 from public.qr_codes q
                 where q.id = p_qr_code_id and q.content_kind = 'feedback') then
    raise exception 'not a feedback QR';
  end if;
  if p_ip_hash is not null then
    select count(*) into v_recent from public.feedback_responses fr
      where fr.qr_code_id = p_qr_code_id and fr.submitter_ip_hash = p_ip_hash
        and fr.submitted_at > now() - interval '1 hour';
    if v_recent >= 8 then raise exception 'rate_limited'; end if;
  end if;
  insert into public.feedback_responses (qr_code_id, rating, comment, email, submitter_ip_hash)
  values (p_qr_code_id, p_rating, nullif(btrim(p_comment),''), nullif(btrim(p_email),''), p_ip_hash);
end; $$;
revoke all on function public.submit_feedback(uuid,int,text,text,text) from public;
grant execute on function public.submit_feedback(uuid,int,text,text,text) to anon, authenticated;
