alter table public.community_quotes add column if not exists status text not null default 'pending';
alter table public.community_quotes add column if not exists source_message_id text;
alter table public.community_quotes add column if not exists submitted_by text;
alter table public.community_quotes add column if not exists bot_announced_at timestamptz;
alter table public.community_quotes drop constraint if exists community_quotes_status_check;
alter table public.community_quotes add constraint community_quotes_status_check check (status in ('pending','approved','rejected','archived'));
update public.community_quotes set status = case when approved then 'approved' else 'pending' end;

alter table public.game_players add column if not exists birthday_public boolean not null default true;
alter table public.game_players add column if not exists birthday_party_enabled boolean not null default true;
alter table public.game_players add column if not exists birthday_message text;

insert into public.community_metrics(metric_key,label,value,helper_text,source,is_public) values
  ('followers','SEGUIDORES','04.2K','TWITCH + KICK','MANUAL',true),
  ('active_subs','SUBS ATIVOS','0328','DADOS AUTORIZADOS','MANUAL',true),
  ('watch_hours','HORAS ASSISTIDAS','18.6K','CALCULADAS PELO SISTEMA','MANUAL',true),
  ('chaos_clips','CLIPES DO CAOS','01.3K','PROVAS DOCUMENTAIS','MANUAL',true)
on conflict(metric_key) do nothing;

insert into public.community_quotes(quote_text,author_name,platform,quoted_at,approved,status,submitted_by,bot_announced_at) values
  ('Eu vim pela gameplay. Fiquei pelo desastre.','gabi.exe','TWITCH','2026-08-09 18:00:00-03',true,'approved','THENEES',now()),
  ('Tecnicamente não perdemos. Só paramos de ganhar.','pixelmago','KICK','2026-08-02 18:00:00-03',true,'approved','MODERAÇÃO',now()),
  ('O plano funcionou até a parte em que começou.','luquinhas_77','TWITCH','2026-07-27 18:00:00-03',true,'approved','THENEES',now())
on conflict do nothing;

create or replace view public.community_birthdays_today as
select id,username,display_name,platform,category,birthday,birthday_message
from public.game_players
where active=true and birthday is not null and birthday_public=true and birthday_party_enabled=true
  and extract(month from birthday)=extract(month from timezone('America/Sao_Paulo',now()))
  and extract(day from birthday)=extract(day from timezone('America/Sao_Paulo',now()));

grant select on public.community_birthdays_today to authenticated;
