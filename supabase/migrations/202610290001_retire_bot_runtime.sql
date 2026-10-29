-- Permanently retire the legacy Twitch/Kick bot runtime.
-- This migration intentionally removes bot data, credentials, queues,
-- subscriptions and database routines while preserving the site, community,
-- ChatBattle, quotes, schedules and general administration data.

drop trigger if exists queue_new_player_trigger on public.game_players;
drop trigger if exists queue_published_quote_trigger on public.community_quotes;
drop trigger if exists enforce_command_outbox_integrity_trigger on public.bot_outbox;

drop function if exists public.enqueue_bot_event(text,jsonb,text);
drop function if exists public.queue_new_player();
drop function if exists public.queue_published_quote();
drop function if exists public.queue_today_birthdays();
drop function if exists public.queue_due_chat_timers();
drop function if exists public.increment_bot_user_counter(uuid,text,text,text,text,date);
drop function if exists public.enforce_command_outbox_integrity();
drop function if exists public.recover_stale_bot_outbox();
drop function if exists public.prune_bot_runtime_history();
drop function if exists public.reserve_bot_rate_limit(text,integer);

drop function if exists public.disconnect_platform(text);
drop function if exists public.get_platform_token(text);
drop function if exists public.store_platform_token(text,text,text,text,text[],timestamptz,text,text);
drop function if exists public.consume_oauth_state(text,text);
drop function if exists public.create_oauth_state(text,text,text);
drop function if exists public.consume_oauth_state_pkce(text,text);
drop function if exists public.create_oauth_state_pkce(text,text,text,text);

drop table if exists public.bot_delivery_logs cascade;
drop table if exists public.bot_outbox cascade;
drop table if exists public.bot_rate_limits cascade;
drop table if exists public.bot_viewer_messages cascade;
drop table if exists public.bot_user_counters cascade;
drop table if exists public.bot_command_events cascade;
drop table if exists public.bot_command_global_usage cascade;
drop table if exists public.bot_command_usage cascade;
drop table if exists public.bot_command_responses cascade;
drop table if exists public.bot_counters cascade;
drop table if exists public.bot_chat_presence cascade;
drop table if exists public.bot_chat_timers cascade;
drop table if exists public.bot_automations cascade;
drop table if exists public.bot_commands cascade;
drop table if exists public.bot_channels cascade;

drop table if exists public.twitch_eventsub_subscriptions cascade;
drop table if exists public.kick_event_subscriptions cascade;
drop table if exists public.platform_events cascade;
drop table if exists public.platform_integrations cascade;
drop table if exists private.platform_tokens cascade;
drop table if exists private.oauth_states cascade;

alter table public.community_quotes
  drop column if exists bot_announced_at,
  drop column if exists bot_queued_at;

delete from public.control_publication_history
where area_key in ('03-00','03-01','03-03','03-04','03-05','03-06','03-07','03-08','03-09')
   or lower(summary) similar to '%(bot|arrobasrv|comando|timer|automação)%';

update public.site_settings
set value = jsonb_set(
              jsonb_set(
                value,
                '{gameText}',
                to_jsonb('Um game persistente conectado à comunidade. Cada pessoa cria seu personagem, participa das decisões coletivas e, quando a transmissão termina, continua a jornada em sua própria área de perfil.'::text),
                true
              ),
              '{labText}',
              to_jsonb('Experiências interativas, ferramentas para a comunidade e ideias perigosamente próximas de virar produto.'::text),
              true
            ),
    updated_at = now()
where key = 'site_content';
