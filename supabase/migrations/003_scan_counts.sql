-- ============================================================
-- Masaar — 003: aggregate scan-count RPC
--
-- Fixes audit finding P1. The dashboard pulled every scan row for the
-- user's QRs into the Node process and counted them in JS — O(scans)
-- transfer just to render per-card badges. This does the COUNT in
-- Postgres and returns one row per QR.
--
-- SECURITY INVOKER (default): the scans RLS policy `scans_owner_read`
-- still applies, so a caller only ever counts scans for QRs they own.
-- ============================================================

create or replace function public.scan_counts(p_ids uuid[])
returns table (qr_code_id uuid, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select s.qr_code_id, count(*)::bigint
  from public.scans s
  where s.qr_code_id = any(p_ids)
  group by s.qr_code_id;
$$;

revoke all on function public.scan_counts(uuid[]) from public;
grant execute on function public.scan_counts(uuid[]) to authenticated;
