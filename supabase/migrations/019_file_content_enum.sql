-- C/1 — extend content_kind with the three file-hosted types. The stale
-- session prompt called the enum `qr_content_type`; the live enum is
-- `content_kind` (values url/text/vcard/wifi/email/sms/phone/whatsapp/
-- app_link). Isolated in its own migration so the new values are
-- committed before any later migration/code uses them (Postgres won't
-- let you ADD VALUE and USE it in the same transaction).
ALTER TYPE public.content_kind ADD VALUE IF NOT EXISTS 'pdf';
ALTER TYPE public.content_kind ADD VALUE IF NOT EXISTS 'image';
ALTER TYPE public.content_kind ADD VALUE IF NOT EXISTS 'video';
