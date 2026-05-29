-- C2 — the old claim_draft_qrs UPDATE claimed EVERY draft sharing the
-- token (the LIMIT 1 only capped the RETURN, not the UPDATE), so a pile of
-- anonymous demo QRs all attached to a fresh signup. Claim ONLY the single
-- most-recent matching draft (the QR actually being checked out); stray
-- anon QRs stay unclaimed and age out via the 24h window. Also pins
-- search_path to include pg_temp.
CREATE OR REPLACE FUNCTION public.claim_draft_qrs(p_draft_token uuid)
RETURNS TABLE(short_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
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
  update public.qr_codes
     set user_id = v_uid,
         draft_token = null
   where id = (
     select q.id
     from public.qr_codes q
     where q.draft_token = p_draft_token
       and q.user_id is null
       and q.status = 'pending_payment'
       and q.created_at > now() - interval '24 hours'
     order by q.created_at desc
     limit 1
   )
  returning qr_codes.short_id;
end;
$function$;
