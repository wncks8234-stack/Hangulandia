-- 2026-11-22 final check
-- 1) RLS: evaluate auth.uid()/is_admin() once per query, not per row (Supabase advisor auth_rls_initplan)
alter policy profiles_read on public.profiles using ((id = (select auth.uid())) or (select public.is_admin()));
alter policy wallets_read on public.wallets using ((user_id = (select auth.uid())) or (select public.is_admin()));
alter policy daily_read on public.daily_earn using ((user_id = (select auth.uid())) or (select public.is_admin()));
alter policy state_read on public.user_state using ((user_id = (select auth.uid())) or (select public.is_admin()));
alter policy enroll_read on public.enrollments using ((user_id = (select auth.uid())) or (select public.is_admin()));
alter policy adminlog_read on public.admin_log using ((select public.is_admin()));
alter policy errors_read on public.client_errors using ((select public.is_admin()));

-- 2) save_state: refuse oversized snapshots (abuse / runaway client), and drop the caller's daily_earn rows older than 60 days
create or replace function public.save_state(p_data jsonb, p_client_ver text default null::text)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  uid uuid := auth.uid();
  want int; have int; cap int; got int; give int; newc int; first boolean;
  clean jsonb; at timestamptz;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if jsonb_typeof(p_data) <> 'object' then raise exception 'bad state'; end if;
  if pg_column_size(p_data) > 1048576 then raise exception 'state too large' using errcode = '54000'; end if;
  insert into public.wallets (user_id) values (uid) on conflict (user_id) do nothing;
  first := not exists (select 1 from public.user_state where user_id = uid);

  want := greatest(0, coalesce(nullif(regexp_replace(coalesce(p_data->>'yoolmi-coins', ''), '[^0-9]', '', 'g'), '')::int, 0));
  select carrots into have from public.wallets where user_id = uid for update;
  if want < have then
    newc := want;
  elsif first then
    cap := coalesce((select (value)::text::int from public.app_config where key = 'carrot_import_cap'), 500);
    newc := have + least(want - have, cap);
  else
    cap := coalesce((select (value)::text::int from public.app_config where key = 'carrot_daily_cap'), 60);
    insert into public.daily_earn (user_id, day) values (uid, public.kst_today()) on conflict do nothing;
    select earned into got from public.daily_earn where user_id = uid and day = public.kst_today() for update;
    give := least(want - have, greatest(0, cap - got));
    newc := have + give;
    if give > 0 then update public.daily_earn set earned = earned + give where user_id = uid and day = public.kst_today(); end if;
  end if;
  update public.wallets set carrots = newc, updated_at = now() where user_id = uid;
  delete from public.daily_earn where user_id = uid and day < public.kst_today() - 60;

  clean := p_data - 'yoolmi-coins' - 'yoolmi-paid' - 'yoolmi-pay' - 'yoolmi-chat-ban' - 'yoolmi-chat-strike';
  insert into public.user_state (user_id, data, client_ver, updated_at) values (uid, clean, left(p_client_ver, 40), now())
  on conflict (user_id) do update set data = excluded.data, client_ver = excluded.client_ver, updated_at = now()
  returning updated_at into at;

  update public.profiles set
    nickname = coalesce(left(nullif(p_data->>'yoolmi-nick', ''), 24), nickname),
    lang = case when p_data->>'yoolmi-lang' in ('ko', 'es') then p_data->>'yoolmi-lang' else lang end,
    age_range = coalesce(left(nullif(p_data->>'yoolmi-age', ''), 16), age_range),
    country_code = coalesce(left(nullif(trim(both '"' from p_data->>'yoolmi-country'), ''), 4), country_code),
    last_seen_at = now()
  where id = uid;

  return jsonb_build_object('carrots', newc, 'state_at', at,
    'paid', exists (select 1 from public.enrollments e where e.user_id = uid and e.status = 'active'
                    and (e.ends_on is null or e.ends_on >= public.kst_today())));
end $function$;

-- 3) client error log keeps 30 days (cleaned as new errors arrive)
create or replace function public.log_client_error(p_ver text, p_page text, p_msg text)
 returns void language plpgsql security definer set search_path to 'public' as $function$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  if (select count(*) from public.client_errors where user_id = uid and at > now() - interval '1 day') >= 50 then return; end if;
  insert into public.client_errors (user_id, ver, page, msg) values (uid, left(p_ver, 40), left(p_page, 60), left(p_msg, 500));
  delete from public.client_errors where at < now() - interval '30 days';
end $function$;

-- 4) helper functions are internal only (callable from policies/other functions, not from the API)
revoke execute on function public.class_next_start(text, timestamptz) from authenticated, anon, public;
