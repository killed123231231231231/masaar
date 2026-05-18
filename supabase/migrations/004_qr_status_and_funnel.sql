-- ============================================================
-- Masaar — 004: QR status machine + anonymous-draft funnel +
--               subscription scaffold
--
-- Sprint 2 Session A keystone migration. ADDITIVE ONLY (no drops,
-- no column type changes) so it is safe to apply to the live project
-- while the funnel code is still on an unmerged branch.
--
-- TWO DELIBERATE DEVIATIONS FROM THE SESSION SPEC (see report):
--
--  1. The spec asked for a NEW `content_type` enum + column,
--     "backfilled from kind". The schema already has `content_kind`
--     (enum: url,text,vcard,wifi,email,sms,phone) which IS the content
--     type; `kind` is the unrelated static/dynamic mechanism. Adding a
--     parallel `content_type` column would duplicate `content_kind`
--     (dual source of truth -> rot; STRATEGY.md §3.3 explicitly warns
--     against this). We instead EXTEND `content_kind` and expose it to
--     callers AS `content_type` via the resolver's return column. No
--     data backfill needed (every row already has a valid
--     content_kind). Downstream sessions that "extend content_type"
--     should `ALTER TYPE content_kind ADD VALUE ...`.
--
--  2. The spec said "update resolve_qr". `resolve_qr` is what the
--     CURRENTLY-DEPLOYED production /r/[shortId] route calls, and prod
--     keeps running the old code until this branch merges (shared DB
--     across prod + preview). Mutating it would change prod redirect
--     behaviour for non-active rows during that unmerged window. We
--     instead ADD `resolve_qr_v2` and leave `resolve_qr` untouched, so
--     prod is provably unaffected until the new edge route ships.
-- ============================================================

-- 1. content_kind: add this session's two new content types. Future
--    sessions extend the SAME enum (pdf, image, video, location,
--    feedback, menu). ADD VALUE IF NOT EXISTS is idempotent; no value
--    is used in this migration so the PG "can't use new label in same
--    txn" rule does not apply.
alter type content_kind add value if not exists 'whatsapp';
alter type content_kind add value if not exists 'app_link';

-- 2. QR lifecycle status machine (STRATEGY.md §3.3).
do $$
begin
  create type qr_status as enum
    ('draft', 'pending_payment', 'active', 'suspended');
exception
  when duplicate_object then null;
end
$$;

-- 3. qr_codes: status + anonymous-claim draft token (additive).
alter table public.qr_codes
  add column if not exists status      qr_status not null default 'pending_payment',
  add column if not exists draft_token uuid;

create index if not exists qr_codes_draft_token_idx
  on public.qr_codes (draft_token)
  where draft_token is not null;

-- Existing rows are already live in production — keep them resolving.
update public.qr_codes set status = 'active'
  where is_active = true  and status <> 'active';
update public.qr_codes set status = 'suspended'
  where is_active = false and status = 'pending_payment';

-- 4. profiles: subscription / Stripe scaffold. All nullable, unused
--    this session (PAYMENTS_ENABLED=false). Present so later payment
--    wiring is a code change, not a migration.
alter table public.profiles
  add column if not exists subscription_status    text,
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end     timestamptz;

-- 5. resolve_qr_v2 — additive resolver for the status-aware edge route.
--    Returns the row for ANY status (the edge route decides what to do
--    per status); `content_type` is sourced from `content_kind`.
--    SECURITY DEFINER so anon resolves past RLS, but it only ever
--    returns these four columns (never password_hash / payload_json).
create or replace function public.resolve_qr_v2(p_short_id text)
returns table (id uuid, destination text, status text, content_type text)
language sql
stable
security definer
set search_path = public
as $$
  select q.id,
         q.destination,
         q.status::text,
         q.content_kind::text
  from public.qr_codes q
  where q.short_id = p_short_id
  limit 1;
$$;

revoke all on function public.resolve_qr_v2(text) from public;
grant execute on function public.resolve_qr_v2(text) to anon, authenticated;
