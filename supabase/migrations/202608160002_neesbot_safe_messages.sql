-- Safe-by-default: no message leaves NeesBot until an owner, admin or
-- moderator explicitly enables that command/event in Thenees Control.
alter table public.bot_commands alter column enabled set default false;
alter table public.bot_automations alter column enabled set default false;

update public.bot_commands set enabled=false,updated_at=now();
update public.bot_automations set enabled=false,updated_at=now();
update public.bot_outbox
set status='cancelled',processed_at=now(),last_error='Cancelado pelo modo seguro do Thenees Control.'
where status in ('pending','processing','failed');

insert into public.bot_automations(event_key,label,message_template,target_platform,enabled,include_site_link) values
('command_response','RESPOSTAS DE COMANDOS','{{message}}','BOTH',false,false),
('moderator_feedback','CONFIRMAÇÕES PARA MODERADORES','{{message}}','BOTH',false,false),
('follow_received','NOVO FOLLOW','{{message}}','BOTH',false,false),
('sub_received','NOVO SUB','{{message}}','BOTH',false,false),
('bits_received','NOVOS BITS','{{message}}','BOTH',false,false)
on conflict(event_key) do update
set enabled=false,label=excluded.label,message_template=excluded.message_template,updated_at=now();
