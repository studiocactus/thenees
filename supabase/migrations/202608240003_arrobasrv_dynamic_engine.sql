-- ArrobaSrv Dynamic Engine
-- Extends simple text commands without breaking existing records.

alter table public.bot_commands add column if not exists command_type text not null default 'text';
alter table public.bot_commands add column if not exists category text not null default 'community';
alter table public.bot_commands add column if not exists aliases text[] not null default '{}';
alter table public.bot_commands add column if not exists platform_scope text not null default 'BOTH';
alter table public.bot_commands add column if not exists global_cooldown_seconds integer not null default 0;
alter table public.bot_commands add column if not exists approval_status text not null default 'approved';
alter table public.bot_commands add column if not exists created_by text;
alter table public.bot_commands add column if not exists usage_count bigint not null default 0;
alter table public.bot_commands add column if not exists last_used_at timestamptz;

alter table public.bot_commands drop constraint if exists bot_commands_command_type_check;
alter table public.bot_commands add constraint bot_commands_command_type_check check(command_type in ('text','random','counter','dice','choice','eight_ball'));
alter table public.bot_commands drop constraint if exists bot_commands_platform_scope_check;
alter table public.bot_commands add constraint bot_commands_platform_scope_check check(platform_scope in ('TWITCH','KICK','BOTH'));
alter table public.bot_commands drop constraint if exists bot_commands_global_cooldown_check;
alter table public.bot_commands add constraint bot_commands_global_cooldown_check check(global_cooldown_seconds between 0 and 86400);
alter table public.bot_commands drop constraint if exists bot_commands_approval_status_check;
alter table public.bot_commands add constraint bot_commands_approval_status_check check(approval_status in ('draft','review','approved','rejected'));

create table if not exists public.bot_command_responses (
  id uuid primary key default gen_random_uuid(),
  command_id uuid not null references public.bot_commands(id) on delete cascade,
  response_template text not null check(char_length(response_template) between 1 and 500),
  weight integer not null default 1 check(weight between 1 and 100),
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_counters (
  id uuid primary key default gen_random_uuid(),
  counter_key text not null unique check(counter_key ~ '^[a-z0-9_]+$'),
  label text not null,
  value bigint not null default 0,
  increment_message text not null default '{{label}}: {{value}}',
  display_message text not null default '{{label}}: {{value}}',
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_command_global_usage (
  platform text not null check(platform in ('TWITCH','KICK')),
  command_id uuid not null references public.bot_commands(id) on delete cascade,
  used_at timestamptz not null default now(),
  primary key(platform,command_id)
);

create table if not exists public.bot_command_events (
  id uuid primary key default gen_random_uuid(),
  command_id uuid references public.bot_commands(id) on delete set null,
  command text not null,
  platform text not null check(platform in ('TWITCH','KICK')),
  platform_user_id text not null,
  username text not null,
  arguments text,
  outcome text not null check(outcome in ('sent','cooldown','denied','error')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists bot_command_responses_command_idx on public.bot_command_responses(command_id,enabled,sort_order);
create index if not exists bot_command_events_recent_idx on public.bot_command_events(created_at desc);
create index if not exists bot_command_events_command_idx on public.bot_command_events(command_id,created_at desc);

alter table public.bot_command_responses enable row level security;
alter table public.bot_counters enable row level security;
alter table public.bot_command_global_usage enable row level security;
alter table public.bot_command_events enable row level security;

drop policy if exists "bot_command_responses_team" on public.bot_command_responses;
drop policy if exists "bot_counters_team" on public.bot_counters;
drop policy if exists "bot_command_events_team" on public.bot_command_events;
create policy "bot_command_responses_team" on public.bot_command_responses for all to authenticated using(public.has_admin_role(array['owner','admin','moderator'])) with check(public.has_admin_role(array['owner','admin','moderator']));
create policy "bot_counters_team" on public.bot_counters for all to authenticated using(public.has_admin_role(array['owner','admin','moderator'])) with check(public.has_admin_role(array['owner','admin','moderator']));
create policy "bot_command_events_team" on public.bot_command_events for select to authenticated using(public.has_admin_role(array['owner','admin','moderator']));

insert into public.bot_commands(command,description,response_template,permission,cooldown_seconds,enabled,sort_order,command_type,category,global_cooldown_seconds,approval_status) values
('!dado','Rola um dado. Aceita a quantidade de lados.','@{{display_name}} rolou o dado e tirou {{random_number}}.','everyone',5,false,20,'dice','games',2,'approved'),
('!escolhe','Escolhe uma opção separada por |.','O ArrobaSrv escolheu: {{choice}}. Qualquer reclamação será ignorada.','everyone',10,false,21,'choice','games',3,'approved'),
('!8ball','Responde perguntas com absoluta falta de responsabilidade.','{{random_response}}','everyone',15,false,22,'eight_ball','games',5,'approved'),
('!vacilo','Contador comunitário de pequenos desastres.','Vacilos oficialmente registrados: {{counter_value}}.','moderator',3,false,23,'counter','community',1,'approved')
on conflict(command) do nothing;

insert into public.bot_counters(counter_key,label,increment_message,display_message) values
('vacilo','VACILOS','Vacilo registrado. Total da firma: {{value}}.','A auditoria encontrou {{value}} vacilos até agora.')
on conflict(counter_key) do nothing;

insert into public.bot_command_responses(command_id,response_template,weight,sort_order)
select command.id,response.response,1,response.position
from public.bot_commands command
cross join lateral (values
  ('Sim. Estranhamente, tudo indica que sim.',1),
  ('Não. E o ArrobaSrv recomenda fingir que essa pergunta nunca aconteceu.',2),
  ('Talvez. Consulte novamente depois de um café.',3),
  ('As chances são boas, o que geralmente é um péssimo sinal.',4),
  ('O chat decidiu que sim. O chat também não será responsabilizado.',5),
  ('Resposta indisponível por excesso de sinceridade.',6)
) as response(response,position)
where command.command='!8ball'
and not exists(select 1 from public.bot_command_responses existing where existing.command_id=command.id);
