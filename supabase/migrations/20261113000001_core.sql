-- Hangulandia core schema: accounts, server-authoritative carrots and enrollment, device state sync,
-- account deletion, admin actions with audit log, client error log.
-- Rules: RLS on every table; clients never write tables directly, only through the functions below.

-- ---------- tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  provider text,
  nickname text check (char_length(nickname) <= 24),
  country_code text check (char_length(country_code) <= 4),
  age_range text check (char_length(age_range) <= 16),
  lang text check (lang in ('ko', 'es')),
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.wallets (
  user_id uuid primary key references public.profiles on delete cascade,
  carrots int not null default 0 check (carrots >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_earn (
  user_id uuid not null references public.profiles on delete cascade,
  day date not null,
  earned int not null default 0,
  primary key (user_id, day)
);

create table if not exists public.user_state (
  user_id uuid primary key references public.profiles on delete cascade,
  data jsonb not null default '{}'::jsonb,
  client_ver text,
  updated_at timestamptz not null default now(),
  constraint user_state_size check (pg_column_size(data) < 400000)
);

create table if not exists public.enrollments (
  user_id uuid not null references public.profiles on delete cascade,
  class_code text not null check (class_code in ('LH', 'SS', 'GE')),
  status text not null check (status in ('pending', 'active', 'ended')),
  starts_on date,
  ends_on date,
  updated_at timestamptz not null default now(),
  primary key (user_id, class_code)
);

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null
);

create table if not exists public.admin_log (
  id bigserial primary key,
  admin_id uuid not null,
  target_id uuid,
  action text not null,
  detail jsonb,
  at timestamptz not null default now()
);

create table if not exists public.client_errors (
  id bigserial primary key,
  user_id uuid references public.profiles on delete cascade,
  ver text,
  page text,
  msg text,
  at timestamptz not null default now()
);
create index if not exists client_errors_at on public.client_errors (at desc);
create index if not exists client_errors_user on public.client_errors (user_id, at);

insert into public.app_config (key, value) values
  ('carrot_daily_cap', '60'::jsonb),
  ('min_version', '""'::jsonb),
  ('flags', '{}'::jsonb)
on conflict (key) do nothing;

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.daily_earn enable row level security;
alter table public.user_state enable row level security;
alter table public.enrollments enable row level security;
alter table public.app_config enable row level security;
alter table public.admin_log enable row level security;
alter table public.client_errors enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy wallets_read on public.wallets for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy daily_read on public.daily_earn for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy state_read on public.user_state for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy enroll_read on public.enrollments for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy config_read on public.app_config for select to anon, authenticated using (true);
create policy adminlog_read on public.admin_log for select to authenticated using (public.is_admin());
create policy errors_read on public.client_errors for select to authenticated using (public.is_admin());
-- no insert/update/delete policies: all writes go through security definer functions

-- ---------- new account ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, provider) values (new.id, coalesce(new.raw_app_meta_data->>'provider', 'google'))
  on conflict (id) do nothing;
  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- helpers ----------
create or replace function public.kst_today() returns date language sql stable as $$
  select (now() at time zone 'Asia/Seoul')::date;
$$;

-- ---------- app API ----------
create or replace function public.get_my_state() returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r jsonb;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  insert into public.profiles (id) values (uid) on conflict (id) do nothing;
  insert into public.wallets (user_id) values (uid) on conflict (user_id) do nothing;
  update public.profiles set last_seen_at = now() where id = uid;
  select jsonb_build_object(
    'state', (select data from public.user_state where user_id = uid),
    'state_at', (select updated_at from public.user_state where user_id = uid),
    'carrots', (select carrots from public.wallets where user_id = uid),
    'paid', exists (select 1 from public.enrollments e where e.user_id = uid and e.status = 'active'
                    and (e.ends_on is null or e.ends_on >= public.kst_today())),
    'enrollments', coalesce((select jsonb_agg(jsonb_build_object('class', class_code, 'status', status, 'starts_on', starts_on, 'ends_on', ends_on))
                             from public.enrollments where user_id = uid), '[]'::jsonb),
    'config', (select jsonb_object_agg(key, value) from public.app_config),
    'member_code', upper(left(uid::text, 8))
  ) into r;
  return r;
end $$;

-- Saves this device's state. Carrots and paid status are decided here, not by the client:
-- spending is always accepted; earning is capped per Korean calendar day (app_config.carrot_daily_cap).
create or replace function public.save_state(p_data jsonb, p_client_ver text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  want int; have int; cap int; got int; give int; newc int;
  clean jsonb; at timestamptz;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if jsonb_typeof(p_data) <> 'object' then raise exception 'bad state'; end if;
  insert into public.wallets (user_id) values (uid) on conflict (user_id) do nothing;

  want := greatest(0, coalesce(nullif(regexp_replace(coalesce(p_data->>'yoolmi-coins', ''), '[^0-9]', '', 'g'), '')::int, 0));
  select carrots into have from public.wallets where user_id = uid for update;
  if want < have then
    newc := want;
  else
    cap := coalesce((select (value)::text::int from public.app_config where key = 'carrot_daily_cap'), 60);
    insert into public.daily_earn (user_id, day) values (uid, public.kst_today()) on conflict do nothing;
    select earned into got from public.daily_earn where user_id = uid and day = public.kst_today() for update;
    give := least(want - have, greatest(0, cap - got));
    newc := have + give;
    if give > 0 then update public.daily_earn set earned = earned + give where user_id = uid and day = public.kst_today(); end if;
  end if;
  update public.wallets set carrots = newc, updated_at = now() where user_id = uid;

  -- server-owned keys are never stored from the client
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
end $$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  delete from auth.users where id = uid;   -- cascades to every table above
end $$;

create or replace function public.log_client_error(p_ver text, p_page text, p_msg text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  if (select count(*) from public.client_errors where user_id = uid and at > now() - interval '1 day') >= 50 then return; end if;
  insert into public.client_errors (user_id, ver, page, msg) values (uid, left(p_ver, 40), left(p_page, 60), left(p_msg, 500));
end $$;

-- ---------- admin API (role = 'admin' only, every change logged) ----------
create or replace function public.admin_set_enrollment(p_user uuid, p_class text, p_status text, p_starts date default null, p_ends date default null, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  insert into public.enrollments (user_id, class_code, status, starts_on, ends_on, updated_at)
  values (p_user, p_class, p_status, p_starts, p_ends, now())
  on conflict (user_id, class_code) do update set status = excluded.status, starts_on = excluded.starts_on, ends_on = excluded.ends_on, updated_at = now();
  insert into public.admin_log (admin_id, target_id, action, detail)
  values (auth.uid(), p_user, 'set_enrollment', jsonb_build_object('class', p_class, 'status', p_status, 'starts', p_starts, 'ends', p_ends, 'note', p_note));
end $$;

create or replace function public.admin_adjust_carrots(p_user uuid, p_delta int, p_note text)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'note required'; end if;
  update public.wallets set carrots = greatest(0, carrots + p_delta), updated_at = now() where user_id = p_user returning carrots into n;
  insert into public.admin_log (admin_id, target_id, action, detail) values (auth.uid(), p_user, 'adjust_carrots', jsonb_build_object('delta', p_delta, 'note', p_note, 'result', n));
  return n;
end $$;

create or replace function public.admin_find_student(p_code text)
returns table (id uuid, nickname text, country_code text, lang text, carrots int, last_seen_at timestamptz, created_at timestamptz, enrollments jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  return query
    select p.id, p.nickname, p.country_code, p.lang, w.carrots, p.last_seen_at, p.created_at,
           coalesce((select jsonb_agg(jsonb_build_object('class', e.class_code, 'status', e.status)) from public.enrollments e where e.user_id = p.id), '[]'::jsonb)
    from public.profiles p left join public.wallets w on w.user_id = p.id
    where upper(left(p.id::text, 8)) = upper(p_code) or p.nickname ilike '%' || p_code || '%'
    order by p.last_seen_at desc limit 50;
end $$;

-- ---------- privileges: only these functions are callable ----------
revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.wallets, public.daily_earn, public.user_state, public.enrollments, public.app_config, public.admin_log, public.client_errors to authenticated;
grant select on public.app_config to anon;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_my_state(), public.save_state(jsonb, text), public.delete_my_account(),
  public.log_client_error(text, text, text), public.is_admin(), public.kst_today(),
  public.admin_set_enrollment(uuid, text, text, date, date, text), public.admin_adjust_carrots(uuid, int, text),
  public.admin_find_student(text) to authenticated;
