-- 030 — multi-color distribution options (purely additive, same pattern as 029).
-- Nullable, NO default, NO backfill: every existing row keeps NULL and renders
-- exactly as before (per-dot scattered colors). No data is modified.
--   palette_options jsonb, e.g.:
--     { "mode": "cluster", "accent_color": "#5B8C2A",
--       "accent_share": 0.06, "cluster_size": 3 }
--   mode "cluster" → nearby dots share a color (blobby pizza-topping regions);
--   accent_color   → rare sprinkle color (herbs/olives) at accent_share frequency.
alter table public.qr_codes
  add column if not exists palette_options jsonb;
