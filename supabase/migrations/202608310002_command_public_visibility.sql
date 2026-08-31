alter table public.bot_commands
  add column if not exists hidden_from_public boolean not null default false;

comment on column public.bot_commands.hidden_from_public is
  'When true, the command remains usable but is omitted from the public !comandos catalog.';
