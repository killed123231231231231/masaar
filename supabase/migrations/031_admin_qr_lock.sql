-- 031 — owner (admin panel) lock for a single QR code. Purely additive.
--
-- NOT APPLIED AUTOMATICALLY. Usama reviews and applies it himself
-- (VERTEXA_QR_RULES.md Rule 5.3). Until it is applied, the /admin Lock and
-- Unlock actions stay switched off and return 409 "migration required".
--
-- Rule 0: no existing row is modified. Both columns are nullable with no
-- backfill; every existing row reads admin_locked = NULL (not locked) and
-- keeps its status, short_id and destination. /r and resolve_qr_v2 are not
-- touched: a locked QR is simply status = 'suspended', which /r already
-- sends to /expired.
--
--   admin_locked       true while the site owner has locked the QR.
--   admin_prev_status  the status the QR had when it was locked
--                      ('active' or 'suspended'), restored on unlock so an
--                      unlock never switches on a QR its owner had paused.

alter table public.qr_codes
  add column if not exists admin_locked boolean,
  add column if not exists admin_prev_status text;

-- Enforcement in the database, so the lock cannot be undone through the
-- owner PATCH route or a direct PostgREST call with the user's own JWT.
-- Only the service role (the /admin routes) may:
--   * change admin_locked / admin_prev_status, and
--   * update a row while it is locked.
-- Requests with no JWT role (migrations, SQL editor) are allowed.
-- Owners can still DELETE their own locked QR; this trigger is UPDATE only.
create or replace function public.qr_codes_enforce_admin_lock()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_role text := coalesce(auth.role(), '');
begin
  if v_role = '' or v_role = 'service_role' then
    return new;
  end if;

  if coalesce(old.admin_locked, false) then
    raise exception 'This QR code was locked by the site owner.'
      using errcode = '42501';
  end if;

  if new.admin_locked is distinct from old.admin_locked
     or new.admin_prev_status is distinct from old.admin_prev_status then
    raise exception 'admin_locked and admin_prev_status can only be changed by the site owner.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists qr_codes_enforce_admin_lock on public.qr_codes;
create trigger qr_codes_enforce_admin_lock
  before update on public.qr_codes
  for each row execute function public.qr_codes_enforce_admin_lock();
