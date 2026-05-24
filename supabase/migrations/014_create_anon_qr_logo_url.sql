-- Sprint 2 Session B.5 Round 2 Bug R2.1/R2.2: anon wizard's
-- create_anon_qr RPC didn't accept logo_url, so qr_codes rows were
-- created with logo_url=NULL even when the wizard uploaded a logo.
-- Visible symptoms (live-reproduced via Chrome MCP before this fix):
--   - Checkout-page QR preview rendered without the logo (no <image>
--     overlay in the qr-code-styling SVG)
--   - Dashboard QR thumbnail rendered without the logo (server-side
--     sharp composite in /api/qr/<id>/render.png had nothing to add)
-- Render-side composite was already correct; the data simply wasn't
-- there.
--
-- Adds p_logo_url text default null at the END of the parameter list
-- (backward-compatible — existing callers compile unchanged). INSERT
-- adds the logo_url column (already exists on qr_codes from earlier
-- migration; this just stops null-defaulting it).
--
-- Implementation note: CREATE OR REPLACE FUNCTION matches by exact
-- argument list — adding a parameter creates an OVERLOAD instead of
-- replacing. Migration drops the old 13-arg signature explicitly so
-- the route's call site resolves unambiguously to the new 14-arg
-- version.

drop function if exists public.create_anon_qr(
  p_name text,
  p_kind qr_kind,
  p_content_kind content_kind,
  p_destination text,
  p_payload_json jsonb,
  p_short_id text,
  p_draft_token uuid,
  p_fg_color text,
  p_bg_color text,
  p_gradient_color text,
  p_dot_style text,
  p_corner_style text,
  p_ip_hash text
);

create or replace function public.create_anon_qr(
  p_name text,
  p_kind qr_kind,
  p_content_kind content_kind,
  p_destination text,
  p_payload_json jsonb,
  p_short_id text,
  p_draft_token uuid,
  p_fg_color text,
  p_bg_color text,
  p_gradient_color text,
  p_dot_style text,
  p_corner_style text,
  p_ip_hash text,
  p_logo_url text default null
)
returns table(id uuid, short_id text)
language plpgsql
security definer
set search_path to 'public'
as $function$
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
        dot_style, corner_style, logo_url, creator_ip_hash
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
        p_logo_url,
        p_ip_hash
      )
      returning qr_codes.id into v_id;

      return query select v_id, v_sid;
      return;
    exception
      when unique_violation then
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
$function$;
