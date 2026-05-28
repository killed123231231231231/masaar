-- C/2 — asset columns + public resolver for /v + storage cleanup queue.
ALTER TABLE public.qr_codes
  ADD COLUMN IF NOT EXISTS asset_url      text,
  ADD COLUMN IF NOT EXISTS asset_size     integer,
  ADD COLUMN IF NOT EXISTS asset_mime     text,
  ADD COLUMN IF NOT EXISTS asset_filename text;

-- /v/[shortId] is a public page and qr_codes has no public read policy,
-- so it reads through this SECURITY DEFINER resolver (same pattern as
-- resolve_qr_v2 / get_renderable_qr). Returns the row for ANY status so
-- the page can branch (active -> render; else -> /activate lock-in).
CREATE OR REPLACE FUNCTION public.resolve_asset_qr(p_short_id text)
RETURNS TABLE(name text, status text, content_kind text, asset_url text,
              asset_mime text, asset_filename text, asset_size integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  select q.name,
         q.status::text       as status,
         q.content_kind::text as content_kind,
         q.asset_url,
         q.asset_mime,
         q.asset_filename,
         q.asset_size
  from public.qr_codes q
  where q.short_id = p_short_id
  limit 1;
$$;
REVOKE EXECUTE ON FUNCTION public.resolve_asset_qr(text) FROM public;
GRANT  EXECUTE ON FUNCTION public.resolve_asset_qr(text) TO anon, authenticated;

-- Storage cleanup: no QR-delete feature exists yet, but a BEFORE DELETE
-- trigger captures any future/admin delete so assets don't orphan
-- (orphaned storage costs money). The queue PROCESSOR (cron/edge fn) is
-- deferred until a delete UI ships -- see BACKLOG.
CREATE TABLE IF NOT EXISTS public.storage_cleanup_queue (
  id           bigint generated always as identity primary key,
  bucket_id    text not null,
  object_path  text not null,
  queued_at    timestamptz not null default now(),
  processed_at timestamptz
);
ALTER TABLE public.storage_cleanup_queue ENABLE ROW LEVEL SECURITY;
-- No policies: rows are written only by the SECURITY DEFINER trigger and
-- read only by the service role.

CREATE OR REPLACE FUNCTION public.enqueue_asset_cleanup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
begin
  if old.asset_url ~ '/storage/v1/object/public/' then
    insert into public.storage_cleanup_queue (bucket_id, object_path)
    select (regexp_match(old.asset_url, '/storage/v1/object/public/([^/]+)/(.+)$'))[1],
           (regexp_match(old.asset_url, '/storage/v1/object/public/([^/]+)/(.+)$'))[2];
  end if;
  return old;
end;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_asset_cleanup ON public.qr_codes;
CREATE TRIGGER trg_enqueue_asset_cleanup
  BEFORE DELETE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_asset_cleanup();
