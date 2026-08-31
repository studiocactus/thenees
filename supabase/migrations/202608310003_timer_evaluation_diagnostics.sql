alter table public.bot_chat_timers
  add column if not exists last_evaluated_at timestamptz,
  add column if not exists last_evaluation jsonb not null default '{}'::jsonb;

create or replace function public.queue_due_chat_timers()
returns integer language plpgsql security definer set search_path='' as $$
declare
  timer public.bot_chat_timers%rowtype; queued integer:=0; timer_queued integer;
  run_key text; recent_messages integer; stream_live boolean; latest_status text;
  evaluation jsonb; eligible boolean; reason text;
begin
  for timer in select * from public.bot_chat_timers where enabled=true and next_run_at<=now() order by next_run_at for update skip locked loop
    timer_queued:=0; evaluation:='{}'::jsonb;
    run_key:='chat-timer:'||timer.id::text||':'||to_char(timer.next_run_at at time zone 'UTC','YYYYMMDDHH24MI');
    if timer.target_platform in ('TWITCH','BOTH') then
      select count(*)::integer into recent_messages from public.platform_events where platform='TWITCH' and event_type='channel.chat.message' and occurred_at>=now()-interval '5 minutes';
      select event_type into latest_status from public.platform_events where platform='TWITCH' and event_type in ('stream.online','stream.offline') order by occurred_at desc limit 1;
      stream_live:=case when latest_status='stream.online' then true when latest_status='stream.offline' then false else recent_messages>0 end;
      eligible:=recent_messages>=timer.min_chat_messages and (timer.run_when='always' or (timer.run_when='online' and stream_live) or (timer.run_when='offline' and not stream_live));
      reason:=case when recent_messages<timer.min_chat_messages then 'insufficient_activity' when timer.run_when='online' and not stream_live then 'stream_offline' when timer.run_when='offline' and stream_live then 'stream_online' else 'eligible' end;
      evaluation:=evaluation||jsonb_build_object('TWITCH',jsonb_build_object('eligible',eligible,'reason',reason,'recent_chat_messages',recent_messages,'is_live',stream_live));
      if eligible then
        insert into public.bot_outbox(event_key,target_platform,payload,rendered_message,dedupe_key) values('chat_timer','TWITCH',jsonb_build_object('timer_id',timer.id,'label',timer.label,'platform','TWITCH','delivery_mode',timer.delivery_mode,'announcement_color',timer.announcement_color,'run_when',timer.run_when,'recent_chat_messages',recent_messages),timer.message_template,run_key||':twitch') on conflict(dedupe_key) do nothing;
        if found then timer_queued:=timer_queued+1; end if;
      end if;
    end if;
    if timer.target_platform in ('KICK','BOTH') then
      select count(*)::integer into recent_messages from public.platform_events where platform='KICK' and event_type='chat.message.sent' and occurred_at>=now()-interval '5 minutes';
      select case when jsonb_typeof(payload->'is_live')='boolean' then (payload->>'is_live')::boolean else null end into stream_live from public.platform_events where platform='KICK' and event_type='livestream.status.updated' order by occurred_at desc limit 1;
      stream_live:=coalesce(stream_live,recent_messages>0);
      eligible:=recent_messages>=timer.min_chat_messages and (timer.run_when='always' or (timer.run_when='online' and stream_live) or (timer.run_when='offline' and not stream_live));
      reason:=case when recent_messages<timer.min_chat_messages then 'insufficient_activity' when timer.run_when='online' and not stream_live then 'stream_offline' when timer.run_when='offline' and stream_live then 'stream_online' else 'eligible' end;
      evaluation:=evaluation||jsonb_build_object('KICK',jsonb_build_object('eligible',eligible,'reason',reason,'recent_chat_messages',recent_messages,'is_live',stream_live));
      if eligible then
        insert into public.bot_outbox(event_key,target_platform,payload,rendered_message,dedupe_key) values('chat_timer','KICK',jsonb_build_object('timer_id',timer.id,'label',timer.label,'platform','KICK','delivery_mode','message','announcement_color',timer.announcement_color,'run_when',timer.run_when,'recent_chat_messages',recent_messages),timer.message_template,run_key||':kick') on conflict(dedupe_key) do nothing;
        if found then timer_queued:=timer_queued+1; end if;
      end if;
    end if;
    if timer_queued>0 then
      update public.bot_chat_timers set last_sent_at=now(),next_run_at=greatest(now(),timer.next_run_at)+make_interval(mins=>timer.interval_minutes),last_evaluated_at=now(),last_evaluation=evaluation,updated_at=now() where id=timer.id;
      queued:=queued+timer_queued;
    else
      update public.bot_chat_timers set next_run_at=now()+interval '1 minute',last_evaluated_at=now(),last_evaluation=evaluation,updated_at=now() where id=timer.id;
    end if;
  end loop;
  return queued;
end; $$;
revoke all on function public.queue_due_chat_timers() from public;
grant execute on function public.queue_due_chat_timers() to authenticated;
