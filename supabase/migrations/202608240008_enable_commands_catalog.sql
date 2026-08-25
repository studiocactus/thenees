insert into public.bot_commands(
  command,description,response_template,permission,cooldown_seconds,enabled,sort_order
) values (
  '!comandos',
  'Mostra uma lista curta dos comandos disponíveis.',
  'O ArrobaSrv está organizando a gaveta de comandos. Tente novamente em instantes.',
  'everyone',
  30,
  true,
  10
)
on conflict(command) do update set
  description=excluded.description,
  response_template=excluded.response_template,
  permission='everyone',
  cooldown_seconds=excluded.cooldown_seconds,
  enabled=true,
  sort_order=excluded.sort_order,
  updated_at=now();
