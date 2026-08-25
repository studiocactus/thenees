create table if not exists public.kick_event_subscriptions (
  id text primary key,
  subscription_type text not null,
  version integer not null default 1,
  status text not null default 'enabled',
  error text,
  updated_at timestamptz not null default now()
);

alter table public.kick_event_subscriptions enable row level security;
drop policy if exists "kick_subscriptions_team" on public.kick_event_subscriptions;
create policy "kick_subscriptions_team" on public.kick_event_subscriptions
  for select to authenticated
  using (public.has_admin_role(array['owner','admin','moderator']));
