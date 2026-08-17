create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  username text not null unique,
  display_name text,
  platform text not null default 'SITE' check (platform in ('TWITCH', 'KICK', 'SITE')),
  category text,
  level integer not null default 1 check (level > 0),
  birthday date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_presence (
  player_id uuid primary key references public.game_players(id) on delete cascade,
  status text not null default 'offline' check (status in ('online', 'playing', 'away', 'offline')),
  platform text check (platform in ('TWITCH', 'KICK', 'SITE')),
  session_id text,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_players_active_idx on public.game_players(active);
create index if not exists game_presence_status_idx on public.game_presence(status);
create index if not exists game_presence_last_seen_idx on public.game_presence(last_seen_at desc);

alter table public.game_players enable row level security;
alter table public.game_presence enable row level security;

create policy "game_players_admin_all" on public.game_players for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "game_presence_admin_all" on public.game_presence for all to authenticated using (public.is_admin()) with check (public.is_admin());
