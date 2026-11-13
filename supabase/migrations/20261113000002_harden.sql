-- Internal functions must not be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rls_auto_enable') then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;
alter function public.kst_today() set search_path = public;
-- Intentionally callable by signed-in users (each checks auth.uid() or is_admin() inside):
-- get_my_state, save_state, delete_my_account, log_client_error, is_admin (used by RLS policies),
-- admin_set_enrollment, admin_adjust_carrots, admin_find_student.
