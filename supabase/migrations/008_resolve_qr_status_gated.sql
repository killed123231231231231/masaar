-- Sprint 2 Session A — Bug 1 root-cause hardening.
-- Legacy resolve_qr() gated on is_active and IGNORED the new status
-- column, so a QR flipped to status='pending_payment' (is_active still
-- true) still resolved to its destination via this function — a
-- lock-in bypass for: (a) the unmerged prod edge route, (b) any direct
-- anon RPC caller (resolve_qr is anon-EXECUTE by Supabase defaults).
--
-- Make it status-aware: only 'active' rows resolve. Safe for live data
-- — migration 004 backfilled all existing prod rows to status='active',
-- so currently-working QRs are unaffected. Additive behavior change,
-- no schema change. resolve_qr_v2 (the funnel resolver) is unchanged.

create or replace function public.resolve_qr(p_short_id text)
returns table (id uuid, destination text)
language sql
security definer
set search_path = public
as $$
  select q.id, q.destination
  from public.qr_codes q
  where q.short_id = p_short_id
    and q.status = 'active'
  limit 1;
$$;
