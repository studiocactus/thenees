create table if not exists public.bot_channels (
  platform text primary key check(platform in ('TWITCH','KICK')),
  channel_name text not null default 'thenees',
  enabled boolean not null default false,
  connection_status text not null default 'disconnected' check(connection_status in ('disconnected','configured','connected','error')),
  last_connected_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_commands (
  id uuid primary key default gen_random_uuid(),
  command text not null unique check(command ~ '^![a-z0-9_]+$'),
  description text not null,
  response_template text not null,
  permission text not null default 'everyone' check(permission in ('everyone','follower','subscriber','moderator','broadcaster')),
  cooldown_seconds integer not null default 10 check(cooldown_seconds between 0 and 86400),
  enabled boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_automations (
  event_key text primary key,
  label text not null,
  message_template text not null,
  target_platform text not null default 'BOTH' check(target_platform in ('TWITCH','KICK','BOTH')),
  enabled boolean not null default false,
  include_site_link boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  target_platform text not null default 'BOTH' check(target_platform in ('TWITCH','KICK','BOTH')),
  payload jsonb not null default '{}'::jsonb,
  rendered_message text,
  status text not null default 'pending' check(status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  dedupe_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.bot_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid references public.bot_outbox(id) on delete set null,
  platform text not null check(platform in ('TWITCH','KICK')),
  status text not null check(status in ('sent','failed','skipped')),
  external_message_id text,
  error_message text,
  delivered_at timestamptz not null default now()
);

alter table public.community_quotes add column if not exists bot_queued_at timestamptz;

create index if not exists bot_outbox_pending_idx on public.bot_outbox(status,available_at);
create index if not exists bot_delivery_logs_outbox_idx on public.bot_delivery_logs(outbox_id,delivered_at desc);

alter table public.bot_channels enable row level security;
alter table public.bot_commands enable row level security;
alter table public.bot_automations enable row level security;
alter table public.bot_outbox enable row level security;
alter table public.bot_delivery_logs enable row level security;

drop policy if exists "bot_channels_team" on public.bot_channels;
drop policy if exists "bot_commands_team" on public.bot_commands;
drop policy if exists "bot_automations_team" on public.bot_automations;
drop policy if exists "bot_outbox_team" on public.bot_outbox;
drop policy if exists "bot_outbox_admin_update" on public.bot_outbox;
drop policy if exists "bot_logs_team" on public.bot_delivery_logs;
create policy "bot_channels_team" on public.bot_channels for all to authenticated using(public.has_admin_role(array['owner','admin','moderator'])) with check(public.has_admin_role(array['owner','admin','moderator']));
create policy "bot_commands_team" on public.bot_commands for all to authenticated using(public.has_admin_role(array['owner','admin','moderator'])) with check(public.has_admin_role(array['owner','admin','moderator']));
create policy "bot_automations_team" on public.bot_automations for all to authenticated using(public.has_admin_role(array['owner','admin','moderator'])) with check(public.has_admin_role(array['owner','admin','moderator']));
create policy "bot_outbox_team" on public.bot_outbox for select to authenticated using(public.has_admin_role(array['owner','admin','moderator']));
create policy "bot_outbox_admin_update" on public.bot_outbox for update to authenticated using(public.has_admin_role(array['owner','admin'])) with check(public.has_admin_role(array['owner','admin']));
create policy "bot_logs_team" on public.bot_delivery_logs for select to authenticated using(public.has_admin_role(array['owner','admin','moderator']));

insert into public.bot_channels(platform,channel_name) values ('TWITCH','thenees'),('KICK','thenees') on conflict(platform) do nothing;

insert into public.bot_commands(command,description,response_template,permission,cooldown_seconds,sort_order) values
('!quote','Registra uma frase no arquivo da comunidade.','Use !quote mensagem para enviar uma frase para moderação.','moderator',5,1),
('!perfil','Mostra o perfil do jogador.','@{{user}}, veja seu personagem em {{profile_url}}','everyone',20,2),
('!rank','Informa o ranking atual.','@{{user}} está no rank #{{rank}} com nível {{level}}.','everyone',15,3),
('!aniversario','Consulta o modo festa.','Hoje celebramos {{birthday_users}}! Enviem parabéns no chat.','everyone',60,4),
('!atacar','Envia uma ação ao ChatBattle.','Ação de @{{user}} registrada: ATACAR.','everyone',2,5),
('!defender','Envia uma ação ao ChatBattle.','Ação de @{{user}} registrada: DEFENDER.','everyone',2,6)
on conflict(command) do nothing;

insert into public.bot_automations(event_key,label,message_template,target_platform,enabled,include_site_link) values
('player_registered','NOVO JOGADOR','NOVO PLAYER: @{{username}} entrou no ChatBattle. Categoria: {{category}}. Boas-vindas à comunidade!','BOTH',false,true),
('birthday_today','ANIVERSÁRIO','Hoje é aniversário de @{{username}}! Comunidade, enviem parabéns e muitos buffs no chat!','BOTH',false,false),
('quote_published','QUOTE PUBLICADA','@{{author}}, sua frase entrou para o arquivo da comunidade! Veja em {{community_url}}','BOTH',false,true),
('live_started','LIVE INICIADA','Thenees está ao vivo em {{platform}}: {{title}} — {{live_url}}','BOTH',false,true),
('chatbattle_event','EVENTO DO CHATBATTLE','{{message}}','BOTH',false,false)
on conflict(event_key) do nothing;

create or replace function public.enqueue_bot_event(p_event_key text,p_payload jsonb,p_dedupe_key text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare automation public.bot_automations%rowtype; queue_id uuid;
begin
  select * into automation from public.bot_automations where event_key=p_event_key and enabled=true;
  if automation.event_key is null then return null; end if;
  insert into public.bot_outbox(event_key,target_platform,payload,rendered_message,dedupe_key)
  values(p_event_key,automation.target_platform,p_payload,automation.message_template,p_dedupe_key)
  on conflict(dedupe_key) do update set dedupe_key=excluded.dedupe_key returning id into queue_id;
  return queue_id;
end; $$;
revoke all on function public.enqueue_bot_event(text,jsonb,text) from public;
grant execute on function public.enqueue_bot_event(text,jsonb,text) to authenticated;

create or replace function public.queue_new_player() returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform public.enqueue_bot_event('player_registered',jsonb_build_object('player_id',new.id,'username',new.username,'display_name',new.display_name,'category',coalesce(new.category,'SEM CLASSE'),'platform',new.platform),'player:'||new.id::text);
  return new;
end; $$;
drop trigger if exists queue_new_player_trigger on public.game_players;
create trigger queue_new_player_trigger after insert on public.game_players for each row execute function public.queue_new_player();

create or replace function public.queue_published_quote() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.approved=true and new.bot_queued_at is null then
    perform public.enqueue_bot_event('quote_published',jsonb_build_object('quote_id',new.id,'author',new.author_name,'quote',new.quote_text,'platform',new.platform),'quote:'||new.id::text);
    update public.community_quotes set bot_queued_at=now() where id=new.id;
  end if;
  return new;
end; $$;
drop trigger if exists queue_published_quote_trigger on public.community_quotes;
create trigger queue_published_quote_trigger after insert or update of approved on public.community_quotes for each row execute function public.queue_published_quote();

create or replace function public.queue_today_birthdays() returns integer language plpgsql security definer set search_path='' as $$
declare player record; queued integer:=0;
begin
  for player in select * from public.community_birthdays_today loop
    perform public.enqueue_bot_event('birthday_today',jsonb_build_object('player_id',player.id,'username',player.username,'display_name',player.display_name,'category',player.category,'message',player.birthday_message),'birthday:'||player.id::text||':'||to_char(timezone('America/Sao_Paulo',now()),'YYYY-MM-DD'));
    queued:=queued+1;
  end loop;
  return queued;
end; $$;
revoke all on function public.queue_today_birthdays() from public;
grant execute on function public.queue_today_birthdays() to authenticated;
