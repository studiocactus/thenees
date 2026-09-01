-- Coordinate announcement sends across concurrent worker invocations. Twitch
-- permits one announcement every two seconds; use three seconds as a safety
-- margin and defer excess work instead of failing or dropping it.

create table if not exists public.bot_rate_limits (
  rate_key text primary key,
  next_allowed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bot_rate_limits enable row level security;
revoke all on table public.bot_rate_limits from public, anon, authenticated;
grant select, insert, update on table public.bot_rate_limits to service_role;

create or replace function public.reserve_bot_rate_limit(
  p_rate_key text,
  p_interval_seconds integer
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  current_next timestamptz;
  wait_seconds integer;
begin
  if coalesce(trim(p_rate_key),'')='' or p_interval_seconds<1 or p_interval_seconds>3600 then
    raise exception 'invalid_rate_limit_parameters' using errcode='22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_rate_key));

  select next_allowed_at into current_next
  from public.bot_rate_limits
  where rate_key=p_rate_key;

  if current_next is not null and current_next>clock_timestamp() then
    wait_seconds:=greatest(1,ceil(extract(epoch from current_next-clock_timestamp()))::integer);
    return wait_seconds;
  end if;

  insert into public.bot_rate_limits(rate_key,next_allowed_at,updated_at)
  values(p_rate_key,clock_timestamp()+make_interval(secs=>p_interval_seconds),clock_timestamp())
  on conflict(rate_key) do update
  set next_allowed_at=excluded.next_allowed_at,updated_at=excluded.updated_at;

  return 0;
end;
$$;

revoke all on function public.reserve_bot_rate_limit(text,integer) from public, anon, authenticated;
grant execute on function public.reserve_bot_rate_limit(text,integer) to service_role;

