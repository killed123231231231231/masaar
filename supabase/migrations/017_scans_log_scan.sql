-- B7/P2-1 — scans had `scans_anon_insert WITH CHECK (true)`, letting
-- anyone POST arbitrary rows to /rest/v1/scans: fake qr_code_id (inflate
-- a competitor), fake scanned_at (skew time-series), or junk geo/device
-- to poison analytics. Replace the open policy with a SECURITY DEFINER
-- log_scan() that controls the row shape (scanned_at is always server
-- now(); only known columns written) and verifies the QR exists. The
-- /r/<short_id> edge route calls this instead of a direct insert. Scan
-- logging is inherently unauthenticated, so this narrows abuse (no
-- column injection / backdating / FK-less rows) rather than eliminating
-- count inflation for a *known* id — a future rate-limit can live here.
create or replace function public.log_scan(
  p_qr_code_id uuid,
  p_country     text default null,
  p_region      text default null,
  p_city        text default null,
  p_device_type text default null,
  p_os          text default null,
  p_browser     text default null,
  p_user_agent  text default null,
  p_ip_hash     text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.qr_codes q where q.id = p_qr_code_id) then
    return;  -- drop garbage / unknown-UUID inserts
  end if;

  insert into public.scans (
    qr_code_id, country, region, city,
    device_type, os, browser, user_agent, ip_hash
  ) values (
    p_qr_code_id, p_country, p_region, p_city,
    p_device_type, p_os, p_browser, p_user_agent, p_ip_hash
  );
end;
$$;

revoke execute on function public.log_scan(uuid, text, text, text, text, text, text, text, text) from public;
grant  execute on function public.log_scan(uuid, text, text, text, text, text, text, text, text) to anon, authenticated;

-- All scan writes now go through log_scan(); direct anon inserts are no
-- longer needed. Drop the always-true policy (advisor 0024).
drop policy if exists scans_anon_insert on public.scans;
