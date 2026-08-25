-- O catálogo de !comandos mantém a lista dinâmica e permite editar o tom no painel.
update public.bot_commands
set
  response_template = 'Comandos na mochila: {{commands}}. Use com moderação ou sem nenhuma.',
  description = 'Mostra automaticamente todos os comandos públicos ativos. O texto pode ser personalizado no painel usando {{commands}}.',
  updated_at = now()
where command = '!comandos';
