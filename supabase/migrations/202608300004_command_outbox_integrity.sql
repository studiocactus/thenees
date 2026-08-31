-- Bind every command response to the exact platform and source chat message.
create or replace function public.enforce_command_outbox_integrity()
returns trigger language plpgsql set search_path='' as $$
declare
  payload_platform text;
  payload_command text;
  source_message_id text;
begin
  if new.event_key not in ('command_response','moderator_feedback') then
    return new;
  end if;

  payload_platform := upper(coalesce(new.payload ->> 'platform',''));
  payload_command := lower(coalesce(new.payload ->> 'command',''));
  source_message_id := btrim(coalesce(new.payload ->> 'source_message_id',''));

  if payload_platform not in ('TWITCH','KICK') then
    raise exception 'command_response_platform_required';
  end if;
  if payload_command !~ '^![a-z0-9_]+$' then
    raise exception 'command_response_command_required';
  end if;
  if source_message_id = '' then
    raise exception 'command_response_source_message_required';
  end if;

  new.target_platform := payload_platform;
  new.rendered_message := '{{message}}';
  return new;
end; $$;

drop trigger if exists enforce_command_outbox_integrity_trigger on public.bot_outbox;
create trigger enforce_command_outbox_integrity_trigger
before insert or update of event_key,target_platform,payload,rendered_message
on public.bot_outbox
for each row execute function public.enforce_command_outbox_integrity();

update public.bot_automations
set message_template = '{{message}}', updated_at = now()
where event_key in ('command_response','moderator_feedback');

update public.bot_outbox
set status = 'failed',
    processed_at = now(),
    last_error = 'legacy_command_response_blocked'
where status = 'pending'
  and event_key in ('command_response','moderator_feedback')
  and (
    created_at < now() - interval '2 minutes'
    or target_platform = 'BOTH'
    or coalesce(payload ->> 'source_message_id','') = ''
    or upper(coalesce(payload ->> 'platform','')) not in ('TWITCH','KICK')
  );
