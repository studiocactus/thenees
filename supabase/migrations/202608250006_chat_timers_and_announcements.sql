-- Separate viewer-triggered commands from scheduled chat timers and carry the
-- Twitch announcement presentation all the way to the delivery worker.

alter table public.bot_commands
  add column if not exists delivery_mode text not null default 'message',
  add column if not exists announcement_color text not null default 'primary';

alter table public.bot_commands drop constraint if exists bot_commands_delivery_mode_check;
alter table public.bot_commands add constraint bot_commands_delivery_mode_check
  check (delivery_mode in ('message','announcement'));
alter table public.bot_commands drop constraint if exists bot_commands_announcement_color_check;
alter table public.bot_commands add constraint bot_commands_announcement_color_check
  check (announcement_color in ('primary','blue','green','orange','purple'));

create table if not exists public.bot_chat_timers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  message_template text not null,
  target_platform text not null default 'BOTH' check (target_platform in ('TWITCH','KICK','BOTH')),
  interval_minutes integer not null default 15 check (interval_minutes between 1 and 1440),
  delivery_mode text not null default 'message' check (delivery_mode in ('message','announcement')),
  announcement_color text not null default 'primary' check (announcement_color in ('primary','blue','green','orange','purple')),
  enabled boolean not null default false,
  next_run_at timestamptz not null default now(),
  last_sent_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bot_chat_timers_due_idx on public.bot_chat_timers(enabled,next_run_at);
alter table public.bot_chat_timers enable row level security;
drop policy if exists "bot_chat_timers_team" on public.bot_chat_timers;
create policy "bot_chat_timers_team" on public.bot_chat_timers for all to authenticated
  using(public.has_admin_role(array['owner','admin','moderator']))
  with check(public.has_admin_role(array['owner','admin','moderator']));

create or replace function public.queue_due_chat_timers()
returns integer language plpgsql security definer set search_path='' as $$
declare timer public.bot_chat_timers%rowtype; queued integer:=0; run_key text;
begin
  for timer in
    select * from public.bot_chat_timers
    where enabled=true and next_run_at<=now()
    order by next_run_at
    for update skip locked
  loop
    run_key := 'chat-timer:'||timer.id::text||':'||to_char(timer.next_run_at at time zone 'UTC','YYYYMMDDHH24MI');
    if timer.target_platform in ('TWITCH','BOTH') then
      insert into public.bot_outbox(event_key,target_platform,payload,rendered_message,dedupe_key)
      values('chat_timer','TWITCH',
        jsonb_build_object('timer_id',timer.id,'label',timer.label,'platform','TWITCH',
          'delivery_mode',timer.delivery_mode,'announcement_color',timer.announcement_color),
        timer.message_template,run_key||':twitch')
      on conflict(dedupe_key) do nothing;
    end if;
    if timer.target_platform in ('KICK','BOTH') then
      insert into public.bot_outbox(event_key,target_platform,payload,rendered_message,dedupe_key)
      values('chat_timer','KICK',
        jsonb_build_object('timer_id',timer.id,'label',timer.label,'platform','KICK',
          'delivery_mode','message','announcement_color',timer.announcement_color),
        timer.message_template,run_key||':kick')
      on conflict(dedupe_key) do nothing;
    end if;
    update public.bot_chat_timers set
      last_sent_at=now(),
      next_run_at=greatest(now(),timer.next_run_at)+make_interval(mins=>timer.interval_minutes),
      updated_at=now()
    where id=timer.id;
    queued:=queued+1;
  end loop;
  return queued;
end; $$;

revoke all on function public.queue_due_chat_timers() from public;
grant execute on function public.queue_due_chat_timers() to authenticated;
