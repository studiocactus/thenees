alter table public.contact_messages add column if not exists company text;
alter table public.contact_messages add column if not exists contact_type text;
alter table public.contact_messages add column if not exists admin_notes text;
alter table public.contact_messages add column if not exists replied_at timestamptz;

insert into public.site_settings(key,value,is_public,updated_at) values
('commercial_content','{
  "coverEyebrow":"STREAMER · DIRETOR DE ARTE · CREATOR",
  "coverTitle":"MARCAS ENTRAM. A COMUNIDADE JOGA.",
  "coverDescription":"Conteúdo, live e experiências interativas construídas para serem vividas — não apenas assistidas.",
  "aboutTitle":"THENEES",
  "aboutText":"Streamer, Diretor de Arte e criador do ChatBattle. Transformo participação do chat em conteúdo, narrativa e experiências que aproximam pessoas e marcas.",
  "differenceTitle":"O CHAT NÃO ASSISTE. ELE DECIDE.",
  "differenceText":"No ChatBattle, a marca pode fazer parte da mecânica: ativar eventos, liberar missões coletivas e recompensar toda a comunidade sem comprar a vitória individual.",
  "formats":[
    {"title":"LIVE PATROCINADA","description":"Produto, desafio e narrativa integrados à transmissão."},
    {"title":"BRANDED GAME","description":"Missões, criaturas e recompensas de marca no ChatBattle."},
    {"title":"CONTEÚDO","description":"YouTube, cortes, redes sociais e campanhas com direção criativa."},
    {"title":"EVENTOS","description":"Presença, cobertura e experiências participativas para a comunidade."}
  ]
}'::jsonb,true,now())
on conflict(key) do nothing;

create or replace function public.submit_contact_message(
  p_sender_name text,
  p_sender_email text,
  p_company text,
  p_contact_type text,
  p_subject text,
  p_message text,
  p_human_answer integer,
  p_website text default ''
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare new_id uuid;
begin
  if coalesce(trim(p_website),'') <> '' or p_human_answer <> 13 then raise exception 'invalid_verification'; end if;
  if length(trim(p_sender_name)) not between 2 and 100 or length(trim(p_sender_email)) not between 5 and 200 or position('@' in p_sender_email)=0 then raise exception 'invalid_identity'; end if;
  if length(trim(p_subject)) not between 3 and 160 or length(trim(p_message)) not between 10 and 4000 then raise exception 'invalid_message'; end if;
  if (select count(*) from public.contact_messages where lower(sender_email)=lower(trim(p_sender_email)) and created_at>now()-interval '1 hour') >= 3 then raise exception 'rate_limited'; end if;
  insert into public.contact_messages(sender_name,sender_email,company,contact_type,subject,message,status)
  values(trim(p_sender_name),lower(trim(p_sender_email)),nullif(trim(p_company),''),nullif(trim(p_contact_type),''),trim(p_subject),trim(p_message),'new') returning id into new_id;
  return new_id;
end; $$;
revoke all on function public.submit_contact_message(text,text,text,text,text,text,integer,text) from public;
grant execute on function public.submit_contact_message(text,text,text,text,text,text,integer,text) to anon,authenticated;
