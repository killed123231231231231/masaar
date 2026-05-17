-- ============================================================
-- Masaar — Initial Database Schema
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------
create type qr_kind as enum ('static', 'dynamic');
create type content_kind as enum (
  'url', 'text', 'vcard', 'wifi', 'email', 'sms', 'phone'
);

-- ----------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- ----------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- FOLDERS — let users organise QR codes
-- ----------------------------------------------------------------
create table public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);
create index folders_user_id_idx on public.folders(user_id);

-- ----------------------------------------------------------------
-- QR CODES
-- ----------------------------------------------------------------
create table public.qr_codes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  folder_id       uuid references public.folders(id) on delete set null,
  short_id        text unique,                       -- only set for dynamic QRs
  name            text not null default 'Untitled',
  kind            qr_kind not null default 'static',
  content_kind    content_kind not null default 'url',
  destination     text not null,                     -- the actual URL/payload
  payload_json    jsonb,                              -- raw fields (vCard, WiFi, etc.)
  password_hash   text,                               -- bcrypt hash if protected

  -- Styling
  fg_color        text not null default '#000000',
  bg_color        text not null default '#FFFFFF',
  gradient_color  text,
  dot_style       text not null default 'square',
  corner_style    text not null default 'square',
  logo_url        text,
  frame_style     text,
  frame_text      text,

  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index qr_codes_user_id_idx  on public.qr_codes(user_id);
create index qr_codes_short_id_idx on public.qr_codes(short_id);

-- ----------------------------------------------------------------
-- SCANS — every redirect hit logs one row
-- ----------------------------------------------------------------
create table public.scans (
  id          bigserial primary key,
  qr_code_id  uuid not null references public.qr_codes(id) on delete cascade,
  scanned_at  timestamptz not null default now(),
  country     text,
  region      text,
  city        text,
  device_type text,                                   -- mobile / desktop / tablet
  os          text,
  browser     text,
  user_agent  text,
  ip_hash     text                                    -- hashed only, no raw IP
);
create index scans_qr_code_id_idx on public.scans(qr_code_id);
create index scans_scanned_at_idx on public.scans(scanned_at desc);

-- ----------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger qr_codes_set_updated_at
  before update on public.qr_codes
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.folders   enable row level security;
alter table public.qr_codes  enable row level security;
alter table public.scans     enable row level security;

-- Profiles: users read/update only their own row
create policy "profiles_self_read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);

-- Folders: full CRUD on own rows
create policy "folders_owner_all" on public.folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- QR codes: full CRUD on own rows
create policy "qr_codes_owner_all" on public.qr_codes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- QR codes: PUBLIC read for active rows so the /r/[shortId] redirect
-- can resolve without an authenticated session.
create policy "qr_codes_public_read_active" on public.qr_codes
  for select using (is_active = true);

-- Scans: owners can read their own scans
create policy "scans_owner_read" on public.scans
  for select using (
    exists (
      select 1 from public.qr_codes q
      where q.id = scans.qr_code_id and q.user_id = auth.uid()
    )
  );

-- Scans: anyone (incl. anon) can insert — the redirect logs scans
-- with the anon key. Validation is by referenced qr_code_id existing.
create policy "scans_anon_insert" on public.scans
  for insert with check (true);

-- ----------------------------------------------------------------
-- STORAGE — logos bucket
-- ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos_owner_upload" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "logos_owner_update" on storage.objects
  for update using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');
