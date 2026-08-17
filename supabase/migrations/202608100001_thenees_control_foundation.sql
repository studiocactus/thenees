create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default 'Thenees',
  role text not null default 'admin' check (role in ('owner', 'admin', 'editor', 'moderator')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.profile_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique,
  label text not null,
  value text not null,
  helper_text text,
  link_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  title text not null,
  game text,
  platform text not null check (platform in ('TWITCH', 'KICK', 'TWITCH + KICK')),
  description text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.featured_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text not null,
  thumbnail_url text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null unique,
  label text not null,
  value text not null,
  helper_text text,
  source text not null default 'MANUAL',
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.community_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_text text not null,
  author_name text not null,
  platform text not null check (platform in ('TWITCH', 'KICK', 'MANUAL')),
  quoted_at timestamptz not null default now(),
  approved boolean not null default false,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  sender_email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived', 'spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_projects (
  id uuid primary key default gen_random_uuid(),
  project_key text not null unique,
  category text not null,
  title text not null,
  description text not null,
  status text not null,
  progress integer not null default 0 check (progress between 0 and 100),
  is_public boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.game_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.profile_items enable row level security;
alter table public.schedule_events enable row level security;
alter table public.featured_videos enable row level security;
alter table public.community_metrics enable row level security;
alter table public.community_quotes enable row level security;
alter table public.contact_messages enable row level security;
alter table public.lab_projects enable row level security;
alter table public.game_settings enable row level security;

create policy "admin_users_admin_all" on public.admin_users for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "site_settings_public_read" on public.site_settings for select to anon, authenticated using (is_public = true or public.is_admin());
create policy "site_settings_admin_write" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "profile_items_public_read" on public.profile_items for select to anon, authenticated using (active = true or public.is_admin());
create policy "profile_items_admin_write" on public.profile_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "schedule_public_read" on public.schedule_events for select to anon, authenticated using (published = true or public.is_admin());
create policy "schedule_admin_write" on public.schedule_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "videos_public_read" on public.featured_videos for select to anon, authenticated using (published = true or public.is_admin());
create policy "videos_admin_write" on public.featured_videos for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "metrics_public_read" on public.community_metrics for select to anon, authenticated using (is_public = true or public.is_admin());
create policy "metrics_admin_write" on public.community_metrics for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "quotes_public_read" on public.community_quotes for select to anon, authenticated using (approved = true or public.is_admin());
create policy "quotes_admin_write" on public.community_quotes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "contacts_admin_only" on public.contact_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "lab_public_read" on public.lab_projects for select to anon, authenticated using (is_public = true or public.is_admin());
create policy "lab_admin_write" on public.lab_projects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "game_public_read" on public.game_settings for select to anon, authenticated using (is_public = true or public.is_admin());
create policy "game_admin_write" on public.game_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value, is_public) values
  ('official_links', '{"twitch":"https://www.twitch.tv/thenees","kick":"https://kick.com/thenees","youtube":"https://www.youtube.com/@theneesr","discord":"https://discord.gg/fUEG3h2ED"}', true),
  ('game', '{"name":"ChatBattle"}', true)
on conflict (key) do nothing;
