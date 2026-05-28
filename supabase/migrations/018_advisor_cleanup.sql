-- B7 — clear standing Supabase advisor WARNs that don't change app
-- behavior. All verified against the live linter (security + perf).

-- (1) function_search_path_mutable (0011): pin set_updated_at's
-- search_path like every other function in this schema.
alter function public.set_updated_at() set search_path = public, pg_temp;

-- (2) public_bucket_allows_listing (0025): the `logos` bucket is public,
-- so object URLs resolve via the storage CDN without this policy. The
-- broad SELECT policy only adds the ability to LIST every file, which
-- the app never does (it builds known public URLs). Drop it.
drop policy if exists logos_public_read on storage.objects;

-- (3) anon/authenticated_security_definer_function_executable (0028/0029):
-- handle_new_user is an auth.users INSERT *trigger*, never meant to be
-- called as an RPC. It fires as the definer regardless of grants, so
-- revoking EXECUTE breaks nothing and removes the /rest/v1/rpc surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- (4) auth_rls_initplan (0003): wrap auth.uid() in a scalar subselect so
-- the planner evaluates it once per query instead of once per row.
-- Behaviorally identical.
alter policy folders_owner_all on public.folders
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy profiles_self_read on public.profiles
  using ((select auth.uid()) = id);

alter policy profiles_self_update on public.profiles
  using ((select auth.uid()) = id);

alter policy qr_codes_owner_all on public.qr_codes
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter policy scans_owner_read on public.scans
  using (exists (
    select 1 from public.qr_codes q
    where q.id = scans.qr_code_id
      and q.user_id = (select auth.uid())
  ));
