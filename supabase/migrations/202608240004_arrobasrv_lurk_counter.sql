alter table public.bot_commands drop constraint if exists bot_commands_command_type_check;
alter table public.bot_commands add constraint bot_commands_command_type_check check(command_type in ('text','random','counter','user_counter','dice','choice','eight_ball'));

create table if not exists public.bot_user_counters (
  id uuid primary key default gen_random_uuid(),
  command_id uuid not null references public.bot_commands(id) on delete cascade,
  platform text not null check(platform in ('TWITCH','KICK')),
  platform_user_id text not null,
  username text not null,
  display_name text,
  session_date date not null default (timezone('America/Sao_Paulo',now()))::date,
  value integer not null default 0 check(value >= 0),
  updated_at timestamptz not null default now(),
  unique(command_id,platform,platform_user_id,session_date)
);

create index if not exists bot_user_counters_today_idx on public.bot_user_counters(command_id,session_date desc,value desc);
alter table public.bot_user_counters enable row level security;
drop policy if exists "bot_user_counters_team" on public.bot_user_counters;
create policy "bot_user_counters_team" on public.bot_user_counters for all to authenticated
using(public.has_admin_role(array['owner','admin','moderator']))
with check(public.has_admin_role(array['owner','admin','moderator']));

create or replace function public.increment_bot_user_counter(
  p_command_id uuid,p_platform text,p_platform_user_id text,p_username text,p_display_name text,p_session_date date
) returns integer language plpgsql security definer set search_path='' as $$
declare next_value integer;
begin
  insert into public.bot_user_counters(command_id,platform,platform_user_id,username,display_name,session_date,value)
  values(p_command_id,p_platform,p_platform_user_id,p_username,p_display_name,p_session_date,1)
  on conflict(command_id,platform,platform_user_id,session_date)
  do update set value=public.bot_user_counters.value+1,username=excluded.username,display_name=excluded.display_name,updated_at=now()
  returning value into next_value;
  return next_value;
end; $$;
revoke all on function public.increment_bot_user_counter(uuid,text,text,text,text,date) from public;

insert into public.bot_commands(command,description,response_template,permission,cooldown_seconds,enabled,sort_order,command_type,category,global_cooldown_seconds,approval_status) values
('!lurk','Ativa o modo lurk e conta quantas vezes cada pessoa usou no dia.','@{{display_name}} ativou o modo lurk pela {{user_count}}ª vez hoje. Presente, silencioso e oficialmente contabilizado.','everyone',3,false,17,'user_counter','community',1,'approved')
on conflict(command) do update set command_type='user_counter',description=excluded.description,updated_at=now();
