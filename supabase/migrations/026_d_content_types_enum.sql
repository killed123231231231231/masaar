-- Session D — new content-kind enum values. Isolated from usage: an
-- ADD VALUE can't be referenced in the same migration it's added, so the
-- schema that uses them lives in 027 (same pattern as 019 for file types).
alter type public.content_kind add value if not exists 'social';
alter type public.content_kind add value if not exists 'location';
alter type public.content_kind add value if not exists 'feedback';
alter type public.content_kind add value if not exists 'payment_placeholder';
