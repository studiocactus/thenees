create table if not exists public.bot_viewer_messages (
  id uuid primary key default gen_random_uuid(),
  platform text not null check(platform in ('TWITCH','KICK')),
  username text not null check(char_length(username) between 1 and 80),
  display_name text,
  message_template text not null check(char_length(message_template) between 1 and 500),
  enabled boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform,username)
);

create index if not exists bot_viewer_messages_lookup_idx
on public.bot_viewer_messages(platform,lower(username)) where enabled=true;

alter table public.bot_viewer_messages enable row level security;
drop policy if exists "bot_viewer_messages_team" on public.bot_viewer_messages;
create policy "bot_viewer_messages_team" on public.bot_viewer_messages for all to authenticated
using(public.has_admin_role(array['owner','admin','moderator']))
with check(public.has_admin_role(array['owner','admin','moderator']));
