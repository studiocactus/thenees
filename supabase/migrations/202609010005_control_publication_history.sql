create table if not exists public.control_publication_history (
  id uuid primary key default gen_random_uuid(),
  area_key text not null,
  summary text not null,
  snapshot jsonb not null default '{}'::jsonb,
  actor_name text not null default 'Control',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists control_publication_history_area_created_idx
  on public.control_publication_history(area_key, created_at desc);

alter table public.control_publication_history enable row level security;

drop policy if exists "control_publication_history_admin_read" on public.control_publication_history;
create policy "control_publication_history_admin_read"
  on public.control_publication_history
  for select to authenticated
  using (public.is_admin());

drop policy if exists "control_publication_history_admin_insert" on public.control_publication_history;
create policy "control_publication_history_admin_insert"
  on public.control_publication_history
  for insert to authenticated
  with check (public.is_admin() and created_by = auth.uid());

grant select, insert on public.control_publication_history to authenticated;
