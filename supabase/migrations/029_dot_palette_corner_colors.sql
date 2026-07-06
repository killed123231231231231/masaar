-- 029 — multi-color solid dots + per-corner finder colors (purely additive).
-- Both columns are nullable with NO default and NO backfill: every existing
-- row keeps NULL and renders exactly as before. No data is modified.
--   dot_palette   — jsonb array of 2..4 hex colors, e.g. ["#FFC107","#1E3A5F"]
--   corner_colors — jsonb array of exactly 3 hex colors [top-left, top-right, bottom-left]
alter table public.qr_codes
  add column if not exists dot_palette jsonb,
  add column if not exists corner_colors jsonb;
