-- Sprint 2 Session A: least-privilege hardening.
-- Supabase's default schema privileges grant EXECUTE on every new
-- public function to the `anon` role directly, so 006's
-- `revoke all ... from public` left an explicit anon grant in place.
-- claim_draft_qrs is no-op-safe for anon (internal auth.uid() guard
-- raises before any UPDATE), but it should never be anon-callable.
-- Additive/idempotent — revoke is safe to re-run.

revoke execute on function public.claim_draft_qrs(uuid) from anon;
