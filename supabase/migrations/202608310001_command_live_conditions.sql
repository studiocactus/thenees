alter table public.bot_commands
  add column if not exists run_when text not null default 'always';

alter table public.bot_commands
  drop constraint if exists bot_commands_run_when_check;

alter table public.bot_commands
  add constraint bot_commands_run_when_check
  check (run_when in ('online','offline','always'));
