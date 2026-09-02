-- BuildTrack — Function hardening (addresses database linter advisories).
--
-- * Pin set_updated_at's search_path.
-- * Remove the default PUBLIC EXECUTE grant from the SECURITY DEFINER
--   functions so they are not reachable as anonymous PostgREST RPCs.
--   The three authorization helpers are re-granted to `authenticated`
--   only, because RLS policies call them as the querying role.
-- * handle_new_user is a trigger function and needs no direct EXECUTE grant.

alter function public.set_updated_at() set search_path = '';

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.is_admin() from public;
revoke execute on function public.can_manage() from public;
revoke execute on function public.current_user_role() from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_manage() to authenticated;
grant execute on function public.current_user_role() to authenticated;
