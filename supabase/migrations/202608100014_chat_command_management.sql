insert into public.bot_commands(
  command, description, response_template, permission, cooldown_seconds, enabled, sort_order
) values (
  '!addcom',
  'Adiciona um novo comando pelo chat. Uso: !addcom !nome resposta',
  'Use !addcom !nome resposta para criar um comando.',
  'moderator',
  5,
  true,
  90
)
on conflict(command) do nothing;

comment on column public.bot_commands.permission is
  'Define quem executa o comando; criação pelo chat exige moderator ou broadcaster.';
