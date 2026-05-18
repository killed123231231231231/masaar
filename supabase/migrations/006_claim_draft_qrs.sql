-- Sprint 2 Session A §6: claim anonymous draft QRs after magic-link auth.
-- SECURITY DEFINER so it can adopt user_id-NULL rows (the owner RLS
-- USING check can't match a NULL owner). Additive only.

create or replace function public.claim_draft_qrs(p_draft_token uuid)
returns table (short_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_draft_token is null then
    return;
  end if;

  return query
  with claimed as (
    update public.qr_codes
       set user_id = v_uid,
           draft_token = null
     where draft_token = p_draft_token
       and user_id is null
    returning qr_codes.short_id, qr_codes.created_at
  )
  select claimed.short_id
  from claimed
  where claimed.short_id is not null
  order by claimed.created_at desc
  limit 1;
end;
$$;

revoke all on function public.claim_draft_qrs(uuid) from public;
grant execute on function public.claim_draft_qrs(uuid) to authenticated;
