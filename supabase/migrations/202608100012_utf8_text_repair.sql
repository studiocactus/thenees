create or replace function public.repair_mojibake(input_text text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
begin
  if input_text !~ '[ÃÂâ]' then
    return normalize(input_text, NFC);
  end if;
  return normalize(convert_from(convert_to(input_text, 'WIN1252'), 'UTF8'), NFC);
exception when others then
  return normalize(input_text, NFC);
end;
$$;

update public.bot_commands
set description = public.repair_mojibake(description),
    response_template = public.repair_mojibake(response_template),
    updated_at = now();

update public.bot_automations
set label = public.repair_mojibake(label),
    message_template = public.repair_mojibake(message_template),
    updated_at = now();

update public.bot_outbox
set rendered_message = public.repair_mojibake(rendered_message),
    last_error = public.repair_mojibake(last_error)
where rendered_message is not null or last_error is not null;

update public.platform_integrations
set display_name = public.repair_mojibake(display_name),
    last_error = public.repair_mojibake(last_error),
    updated_at = now()
where display_name is not null or last_error is not null;

update public.bot_commands
set response_template = 'Hoje celebramos {{birthday_users}}! Enviem parabéns no chat.',
    updated_at = now()
where command = '!aniversario';

update public.bot_automations
set label = 'ANIVERSÁRIO',
    message_template = 'Hoje é aniversário de @{{username}}! Comunidade, enviem parabéns e muitos buffs no chat!',
    updated_at = now()
where event_key = 'birthday_today';

comment on function public.repair_mojibake(text) is 'Repara texto UTF-8 legado interpretado como Windows-1252 e normaliza novos textos para NFC.';
