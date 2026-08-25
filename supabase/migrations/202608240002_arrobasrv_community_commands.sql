-- ArrobaSrv: conjunto inicial de comandos simples, seguros e voltados à comunidade.
-- Comandos públicos começam desligados para revisão no Thenees Control.

insert into public.bot_commands(command,description,response_template,permission,cooldown_seconds,enabled,sort_order) values
('!comandos','Mostra uma lista curta dos comandos disponíveis.','O ArrobaSrv está organizando a gaveta de comandos. Tente novamente em instantes.','everyone',30,false,10),
('!salve','Recebe quem acabou de chegar ao chat.','@{{display_name}} chegou! A cadeira de plástico está liberada e o caos já começou.','everyone',20,false,11),
('!abraco','Envia um abraço para outra pessoa do chat.','@{{display_name}} abraçou @{{target}}. A fiscalização confirmou: abraço regulamentado e sem imposto.','everyone',15,false,12),
('!culpa','Escolhe oficialmente o culpado da vez.','Após uma investigação de 3 segundos, o ArrobaSrv concluiu: a culpa é de @{{target}}.','everyone',20,false,13),
('!nota','Emite uma avaliação completamente questionável.','O ArrobaSrv analisou os fatos e deu nota {{random_number}}/100 para @{{target}}. Não cabe recurso.','everyone',15,false,14),
('!cafe','Consulta o nível de combustível da live.','Café detectado em {{random_number}}%. Abaixo de 30% o streamer começa a responder em câmera lenta.','everyone',30,false,15),
('!lurker','Avisa que a pessoa continuará acompanhando em silêncio.','@{{display_name}} ativou o modo lurker: presente, elegante e fingindo que está trabalhando.','everyone',30,false,16),
('!comando','Gerencia comandos pelo chat. Uso: !comando ajuda','Use !comando ajuda para ver as ferramentas da moderação.','moderator',3,true,90),
('!mensagem','Gerencia mensagens automáticas. Uso: !mensagem ajuda','Use !mensagem ajuda para ver as ferramentas da moderação.','moderator',3,true,91)
on conflict(command) do update set
  description=excluded.description,
  response_template=excluded.response_template,
  permission=excluded.permission,
  cooldown_seconds=excluded.cooldown_seconds,
  sort_order=excluded.sort_order,
  updated_at=now();

insert into public.bot_automations(event_key,label,message_template,target_platform,enabled,include_site_link) values
('first_chat_message','BOAS-VINDAS NO CHAT','@{{display_name}} apareceu no chat! Sejam gentis por pelo menos cinco minutos.','BOTH',false,false),
('raid_received','RAID RECEBIDA','Atenção: @{{user}} trouxe uma raid com {{viewers}} pessoas. Escondam a bagunça e deem boas-vindas!','BOTH',false,false),
('community_reminder','LEMBRETE DA COMUNIDADE','Se você está só assistindo, já faz parte. Se mandar mensagem, passa a responder pelos acontecimentos.','BOTH',false,true),
('discord_reminder','LEMBRETE DO DISCORD','A live termina, mas o caos continua no Discord. Use !discord para encontrar a saída de emergência.','BOTH',false,true)
on conflict(event_key) do nothing;

create table if not exists public.bot_chat_presence (
  id uuid primary key default gen_random_uuid(),
  platform text not null check(platform in ('TWITCH','KICK')),
  platform_user_id text not null,
  username text not null,
  display_name text,
  session_date date not null default (timezone('America/Sao_Paulo',now()))::date,
  first_message_at timestamptz not null default now(),
  unique(platform,platform_user_id,session_date)
);

create index if not exists bot_chat_presence_recent_idx on public.bot_chat_presence(platform,session_date desc);
alter table public.bot_chat_presence enable row level security;
drop policy if exists "bot_chat_presence_team" on public.bot_chat_presence;
create policy "bot_chat_presence_team" on public.bot_chat_presence for select to authenticated
using(public.has_admin_role(array['owner','admin','moderator']));
