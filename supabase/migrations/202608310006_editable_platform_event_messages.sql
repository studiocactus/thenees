-- Editable, multiline platform-event messages with Twitch announcement options.

alter table public.bot_automations
  add column if not exists delivery_mode text not null default 'message',
  add column if not exists announcement_color text not null default 'primary';

alter table public.bot_automations drop constraint if exists bot_automations_delivery_mode_check;
alter table public.bot_automations add constraint bot_automations_delivery_mode_check
  check(delivery_mode in ('message','announcement'));
alter table public.bot_automations drop constraint if exists bot_automations_announcement_color_check;
alter table public.bot_automations add constraint bot_automations_announcement_color_check
  check(announcement_color in ('primary','blue','green','orange','purple'));

insert into public.bot_automations(event_key,label,message_template,target_platform,enabled,include_site_link,delivery_mode,announcement_color) values
('bits_received','BITS RECEBIDOS',E'@{{display_name}} mandou {{bits}} bits! O medidor de caos agradece.\n{{bits}} bits chegaram por @{{display_name}}. A comunidade ficou mais forte!', 'TWITCH',false,false,'message','primary'),
('follow_received','NOVO FOLLOW',E'@{{display_name}} começou a seguir! Seja muito bem-vindo por aqui.\nTem gente nova chegando: @{{display_name}} agora faz parte da comunidade!', 'BOTH',false,false,'message','primary'),
('raid_received','RAID RECEBIDA',E'@{{display_name}} chegou com uma raid de {{viewers}} pessoas! Abram espaço no chat!\nRAID NA ÁREA! @{{display_name}} trouxe {{viewers}} pessoas para a bagunça.', 'TWITCH',false,false,'announcement','purple'),
('sub_received','NOVA INSCRIÇÃO',E'@{{display_name}} virou sub! Buff da comunidade desbloqueado.\nTem sub novo na área: @{{display_name}} fortaleceu a comunidade! Tier {{tier}}.', 'BOTH',false,false,'announcement','green'),
('sub_message_received','MENSAGEM DE INSCRIÇÃO',E'@{{display_name}} renovou o apoio e deixou a mensagem: {{message}}\nMensagem de sub de @{{display_name}}: {{message}}', 'TWITCH',false,false,'announcement','blue')
on conflict(event_key) do update set
  label=excluded.label,
  delivery_mode=coalesce(public.bot_automations.delivery_mode,excluded.delivery_mode),
  announcement_color=coalesce(public.bot_automations.announcement_color,excluded.announcement_color);

create or replace function public.enqueue_bot_event(p_event_key text,p_payload jsonb,p_dedupe_key text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare automation public.bot_automations%rowtype; queue_id uuid;
begin
  select * into automation from public.bot_automations where event_key=p_event_key and enabled=true;
  if automation.event_key is null then return null; end if;
  insert into public.bot_outbox(event_key,target_platform,payload,rendered_message,dedupe_key)
  values(
    p_event_key,
    automation.target_platform,
    coalesce(p_payload,'{}'::jsonb)||jsonb_build_object('delivery_mode',automation.delivery_mode,'announcement_color',automation.announcement_color),
    automation.message_template,
    p_dedupe_key
  )
  on conflict(dedupe_key) do update set dedupe_key=excluded.dedupe_key returning id into queue_id;
  return queue_id;
end; $$;

revoke all on function public.enqueue_bot_event(text,jsonb,text) from public;
grant execute on function public.enqueue_bot_event(text,jsonb,text) to authenticated;
