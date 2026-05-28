-- C/3 — three public storage buckets for file-hosted content. Public
-- read so the /v page + the object URL resolve without a SELECT policy
-- (a public bucket serves object URLs without one -- same as `logos`
-- after migration 018 dropped its listing policy). All WRITES go through
-- /api/upload/[bucket] using the service role, so no client-facing
-- INSERT/UPDATE policies are needed. Supabase enforces the size + MIME
-- caps at the storage layer too (defense-in-depth with the route's own
-- validation).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('qr-pdfs',   'qr-pdfs',   true, 10485760, array['application/pdf']),
  ('qr-images', 'qr-images', true,  5242880, array['image/jpeg','image/png','image/webp']),
  ('qr-videos', 'qr-videos', true, 52428800, array['video/mp4','video/webm'])
on conflict (id) do nothing;
