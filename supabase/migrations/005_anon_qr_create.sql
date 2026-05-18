-- Sprint 2 Session A §5: anonymous QR creation via SECURITY DEFINER RPC
-- (NOT an RLS anon-insert policy — gotcha #6). Per-IP rate limited.
-- Additive only.

alter table public.qr_codes
  add column if not exists creator_ip_hash text;

create index if not exists qr_codes_anon_ratelimit_idx
  on public.qr_codes (creator_ip_hash, created_at)
  where user_id is null;

create or replace function public.create_anon_qr(
  p_name           text,
  p_kind           qr_kind,
  p_content_kind   content_kind,
  p_destination    text,
  p_payload_json   jsonb,
  p_short_id       text,
  p_draft_token    uuid,
  p_fg_color       text,
  p_bg_color       text,
  p_gradient_color text,
  p_dot_style      text,
  p_corner_style   text,
  p_ip_hash        text
)
returns table (id uuid, short_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_id    uuid;
begin
  if p_draft_token is null then
    raise exception 'draft_token required';
  end if;

  -- Per-IP cap: max 10 anon creates / hour (rows still owned by no one).
  select count(*) into v_count
  from public.qr_codes
  where creator_ip_hash = p_ip_hash
    and user_id is null
    and created_at > now() - interval '1 hour';

  if v_count >= 10 then
    raise exception 'rate_limit_exceeded' using errcode = 'check_violation';
  end if;

  insert into public.qr_codes (
    user_id, draft_token, status, name, kind, content_kind, destination,
    payload_json, short_id, fg_color, bg_color, gradient_color,
    dot_style, corner_style, creator_ip_hash
  )
  values (
    null,
    p_draft_token,
    'pending_payment',
    coalesce(nullif(p_name, ''), 'Untitled'),
    coalesce(p_kind, 'dynamic'),
    coalesce(p_content_kind, 'url'),
    p_destination,
    p_payload_json,
    p_short_id,
    coalesce(p_fg_color, '#000000'),
    coalesce(p_bg_color, '#FFFFFF'),
    p_gradient_color,
    coalesce(p_dot_style, 'square'),
    coalesce(p_corner_style, 'square'),
    p_ip_hash
  )
  returning qr_codes.id into v_id;

  return query select v_id, p_short_id;
end;
$$;

revoke all on function public.create_anon_qr(
  text, qr_kind, content_kind, text, jsonb, text, uuid,
  text, text, text, text, text, text
) from public;

grant execute on function public.create_anon_qr(
  text, qr_kind, content_kind, text, jsonb, text, uuid,
  text, text, text, text, text, text
) to anon, authenticated;
