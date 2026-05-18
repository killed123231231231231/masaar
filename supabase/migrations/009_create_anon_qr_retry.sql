-- Sprint 2 Session A — Bug 2. create_anon_qr raised a raw
-- unique_violation (qr_codes_short_id_key) on short_id collision
-- (BACKLOG Step-2 audit #2). Add up to 5 retry attempts: attempt 1
-- keeps the client-provided id (so the previewed/downloaded QR matches
-- what's saved); on collision, regenerate a 7-char id from the SAME
-- unambiguous alphabet as src/lib/shortid.ts and retry. Return the id
-- actually used. CREATE OR REPLACE with the identical signature so the
-- 005/007 grants/revokes are preserved.

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
  v_count    int;
  v_id       uuid;
  v_sid      text;
  v_attempt  int;
  v_i        int;
  v_alphabet constant text :=
    '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
begin
  if p_draft_token is null then
    raise exception 'draft_token required';
  end if;

  select count(*) into v_count
  from public.qr_codes
  where creator_ip_hash = p_ip_hash
    and user_id is null
    and created_at > now() - interval '1 hour';

  if v_count >= 10 then
    raise exception 'rate_limit_exceeded' using errcode = 'check_violation';
  end if;

  v_sid := p_short_id;

  for v_attempt in 1..5 loop
    begin
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
        v_sid,
        coalesce(p_fg_color, '#000000'),
        coalesce(p_bg_color, '#FFFFFF'),
        p_gradient_color,
        coalesce(p_dot_style, 'square'),
        coalesce(p_corner_style, 'square'),
        p_ip_hash
      )
      returning qr_codes.id into v_id;

      return query select v_id, v_sid;
      return;
    exception
      when unique_violation then
        -- Collision (qr_codes_short_id_key) — regenerate and retry.
        v_sid := '';
        for v_i in 1..7 loop
          v_sid := v_sid ||
            substr(v_alphabet,
                   1 + floor(random() * length(v_alphabet))::int, 1);
        end loop;
    end;
  end loop;

  raise exception 'short_id_collision'
    using errcode = 'check_violation';
end;
$$;
