-- Sprint 2 Session A.7: email-holding frictionless checkout.
-- The email is stored on the draft QR row itself (no pending_signups
-- table — fewer moving parts). Additive only.

alter table public.qr_codes
  add column if not exists creator_email text;

create index if not exists qr_codes_creator_email_idx
  on public.qr_codes (creator_email)
  where creator_email is not null;
