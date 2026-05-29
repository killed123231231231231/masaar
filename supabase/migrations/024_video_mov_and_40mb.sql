-- C2 — iPhones record .mov (video/quicktime) and a 25MB cap rejects most
-- real phone clips, so the file content type "video failed" for users.
-- Accept .mov and raise the qr-videos cap to 40MB (the per-IP/per-user
-- 10/hr limiter from migration 023 remains the abuse guard). The route
-- mirrors these values.
update storage.buckets
set file_size_limit = 41943040,  -- 40 MB
    allowed_mime_types = array['video/mp4','video/webm','video/quicktime']
where id = 'qr-videos';
