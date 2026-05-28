-- C/2b — file QRs store their asset URL in `destination` (carried by both
-- existing save paths: /api/qr direct insert and the create_anon_qr RPC,
-- neither of which sets the asset_url column). So /v must fall back to
-- destination. coalesce(asset_url, destination) prefers the dedicated
-- column if a future edit flow ever populates it, else uses destination.
CREATE OR REPLACE FUNCTION public.resolve_asset_qr(p_short_id text)
RETURNS TABLE(name text, status text, content_kind text, asset_url text,
              asset_mime text, asset_filename text, asset_size integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  select q.name,
         q.status::text                          as status,
         q.content_kind::text                    as content_kind,
         coalesce(q.asset_url, q.destination)     as asset_url,
         q.asset_mime,
         q.asset_filename,
         q.asset_size
  from public.qr_codes q
  where q.short_id = p_short_id
  limit 1;
$$;
