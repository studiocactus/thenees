create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9_-]+$'),
  label text not null,
  destination_url text not null check (destination_url ~ '^https?://'),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.short_links enable row level security;

drop policy if exists "short_links_public_read" on public.short_links;
drop policy if exists "short_links_team_write" on public.short_links;

create policy "short_links_public_read"
on public.short_links for select
to anon, authenticated
using (active = true or public.has_admin_role(array['owner','admin','moderator']));

create policy "short_links_team_write"
on public.short_links for all
to authenticated
using (public.has_admin_role(array['owner','admin','moderator']))
with check (public.has_admin_role(array['owner','admin','moderator']));

comment on table public.short_links is
  'Links curtos oficiais no formato https://www.thenees.com.br/go/{slug}.';
