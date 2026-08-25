alter table public.platform_integrations
  add column if not exists bot_user_id text,
  add column if not exists bot_login text,
  add column if not exists bot_display_name text;

comment on column public.platform_integrations.external_user_id is
  'ID do canal/broadcaster. Na Twitch, permanece sendo o canal thenees.';
comment on column public.platform_integrations.bot_user_id is
  'ID da conta que envia e lê mensagens como bot.';

create or replace function public.disconnect_platform(p_platform text)
returns void language plpgsql security definer set search_path='' as $$
begin
  delete from private.platform_tokens where platform=p_platform;
  update public.platform_integrations
     set status='disconnected',eventsub_status='inactive',scopes='{}',
         external_user_id=null,display_name=null,bot_user_id=null,
         bot_login=null,bot_display_name=null,last_error=null,updated_at=now()
   where platform=p_platform;
  update public.bot_channels set enabled=false,connection_status='disconnected',updated_at=now() where platform=p_platform;
end; $$;
revoke all on function public.disconnect_platform(text) from public,anon,authenticated;
grant execute on function public.disconnect_platform(text) to service_role;
