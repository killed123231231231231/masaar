-- 015_draft_token_lifetime.sql
-- Caps claim_draft_qrs to recent, unclaimed, pending rows only.
--
-- Bug: pre-015 the UPDATE matched on (draft_token = X AND user_id IS NULL)
-- with no age constraint. If the wizard's localStorage held a stale token
-- from a prior abandoned session (e.g. agent testing), today's anon flow
-- reused that UUID for a NEW row. claim_draft_qrs then matched BOTH the
-- old orphan AND the new row, attributing both to the new user.
--
-- Real-world hit: 2026-05-24, user b5audit1gwegew@yopmail.com got a phone
-- QR from 2026-05-18 attached to their account on top of the QR they
-- actually built that day. See SPRINT2.md decision log 2026-05-24
-- contamination fix entry.
--
-- The matching update in /api/checkout/anon/route.ts is hardened in the
-- same commit; this migration only touches the RPC the magic-link path uses.

CREATE OR REPLACE FUNCTION public.claim_draft_qrs(p_draft_token uuid)
RETURNS TABLE(short_id text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  with claimed as (
    update public.qr_codes
       set user_id = v_uid,
           draft_token = null
     where draft_token = p_draft_token
       and user_id is null
       and status = 'pending_payment'
       and created_at > now() - interval '24 hours'
    returning qr_codes.short_id, qr_codes.created_at
  )
  select claimed.short_id
  from claimed
  where claimed.short_id is not null
  order by claimed.created_at desc
  limit 1;
end;
$function$;

-- Re-grant — CREATE OR REPLACE preserves grants for the same arg list,
-- but defensive belt-and-suspenders since 007_tighten_claim_grant tightened these.
REVOKE ALL ON FUNCTION public.claim_draft_qrs(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_draft_qrs(uuid) TO authenticated;
