-- Restrict queue-producing routines to trusted server code and require an
-- administrative role for the one operation intentionally exposed in Control.

revoke all on function public.enqueue_bot_event(text,jsonb,text) from public, anon, authenticated;
grant execute on function public.enqueue_bot_event(text,jsonb,text) to service_role;

revoke all on function public.queue_due_chat_timers() from public, anon, authenticated;
grant execute on function public.queue_due_chat_timers() to service_role;

create or replace function public.queue_today_birthdays()
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare player record; queued integer:=0;
begin
  if not public.has_admin_role(array['owner','admin','moderator']) then
    raise exception 'insufficient_privilege' using errcode='42501';
  end if;
  for player in select * from public.community_birthdays_today loop
    perform public.enqueue_bot_event(
      'birthday_today',
      jsonb_build_object(
        'player_id',player.id,
        'username',player.username,
        'display_name',player.display_name,
        'category',player.category,
        'message',player.birthday_message
      ),
      'birthday:'||player.id::text||':'||to_char(timezone('America/Sao_Paulo',now()),'YYYY-MM-DD')
    );
    queued:=queued+1;
  end loop;
  return queued;
end;
$$;

revoke all on function public.queue_today_birthdays() from public, anon;
grant execute on function public.queue_today_birthdays() to authenticated;
