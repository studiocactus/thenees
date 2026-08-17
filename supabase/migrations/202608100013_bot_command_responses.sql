create table if not exists public.bot_command_usage (
  platform text not null check (platform in ('TWITCH','KICK')),
  command_id uuid not null references public.bot_commands(id) on delete cascade,
  platform_user_id text not null,
  used_at timestamptz not null default now(),
  primary key (platform, command_id, platform_user_id)
);

create index if not exists bot_command_usage_time_idx on public.bot_command_usage(used_at desc);
alter table public.bot_command_usage enable row level security;

comment on table public.bot_command_usage is
  'Controle antispam dos comandos do NeesBot por plataforma, comando e usuário.';
