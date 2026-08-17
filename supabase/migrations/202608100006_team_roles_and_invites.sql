create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('admin','editor','moderator')),
  active boolean not null default true,
  invited_by uuid references auth.users(id),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists admin_invites_email_active_idx on public.admin_invites(lower(email)) where active = true and accepted_at is null;
alter table public.admin_invites enable row level security;

create or replace function public.current_admin_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.admin_users where user_id = auth.uid() and active = true limit 1;
$$;
revoke all on function public.current_admin_role() from public;
grant execute on function public.current_admin_role() to authenticated;

create or replace function public.has_admin_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_admin_role() = any(allowed_roles), false);
$$;
revoke all on function public.has_admin_role(text[]) from public;
grant execute on function public.has_admin_role(text[]) to authenticated;

create or replace function public.claim_admin_invite()
returns boolean language plpgsql security definer set search_path = '' as $$
declare invitation public.admin_invites%rowtype; account_email text;
begin
  account_email := lower(coalesce(auth.jwt() ->> 'email',''));
  select * into invitation from public.admin_invites where lower(email)=account_email and active=true and accepted_at is null order by created_at limit 1;
  if invitation.id is null then return false; end if;
  insert into public.admin_users(user_id,email,display_name,role,active)
  values(auth.uid(),account_email,split_part(account_email,'@',1),invitation.role,true)
  on conflict(user_id) do update set role=excluded.role,active=true,updated_at=now();
  update public.admin_invites set active=false,accepted_by=auth.uid(),accepted_at=now() where id=invitation.id;
  return true;
end; $$;
revoke all on function public.claim_admin_invite() from public;
grant execute on function public.claim_admin_invite() to authenticated;

drop policy if exists "admin_users_admin_all" on public.admin_users;
create policy "admin_users_self_read" on public.admin_users for select to authenticated using (user_id=auth.uid() or public.has_admin_role(array['owner','admin']));
create policy "admin_users_management" on public.admin_users for all to authenticated using (public.has_admin_role(array['owner','admin'])) with check (public.has_admin_role(array['owner','admin']));
create policy "admin_invites_management" on public.admin_invites for all to authenticated using (public.has_admin_role(array['owner','admin'])) with check (public.has_admin_role(array['owner','admin']));

drop policy if exists "site_settings_admin_write" on public.site_settings;
drop policy if exists "profile_items_admin_write" on public.profile_items;
drop policy if exists "schedule_admin_write" on public.schedule_events;
drop policy if exists "videos_admin_write" on public.featured_videos;
drop policy if exists "metrics_admin_write" on public.community_metrics;
drop policy if exists "quotes_admin_write" on public.community_quotes;
drop policy if exists "contacts_admin_only" on public.contact_messages;
drop policy if exists "lab_admin_write" on public.lab_projects;
drop policy if exists "game_admin_write" on public.game_settings;
drop policy if exists "game_players_admin_all" on public.game_players;
drop policy if exists "game_presence_admin_all" on public.game_presence;

create policy "site_settings_content_write" on public.site_settings for all to authenticated using (public.has_admin_role(array['owner','admin','editor'])) with check (public.has_admin_role(array['owner','admin','editor']));
create policy "profile_items_content_write" on public.profile_items for all to authenticated using (public.has_admin_role(array['owner','admin','editor'])) with check (public.has_admin_role(array['owner','admin','editor']));
create policy "schedule_content_write" on public.schedule_events for all to authenticated using (public.has_admin_role(array['owner','admin','editor'])) with check (public.has_admin_role(array['owner','admin','editor']));
create policy "videos_content_write" on public.featured_videos for all to authenticated using (public.has_admin_role(array['owner','admin','editor'])) with check (public.has_admin_role(array['owner','admin','editor']));
create policy "metrics_team_write" on public.community_metrics for all to authenticated using (public.has_admin_role(array['owner','admin','editor'])) with check (public.has_admin_role(array['owner','admin','editor']));
create policy "quotes_moderation_write" on public.community_quotes for all to authenticated using (public.has_admin_role(array['owner','admin','moderator'])) with check (public.has_admin_role(array['owner','admin','moderator']));
create policy "contacts_commercial_access" on public.contact_messages for all to authenticated using (public.has_admin_role(array['owner','admin','editor'])) with check (public.has_admin_role(array['owner','admin','editor']));
create policy "lab_content_write" on public.lab_projects for all to authenticated using (public.has_admin_role(array['owner','admin','editor'])) with check (public.has_admin_role(array['owner','admin','editor']));
create policy "game_admin_write_v2" on public.game_settings for all to authenticated using (public.has_admin_role(array['owner','admin'])) with check (public.has_admin_role(array['owner','admin']));
create policy "game_players_team_access" on public.game_players for all to authenticated using (public.has_admin_role(array['owner','admin','moderator'])) with check (public.has_admin_role(array['owner','admin','moderator']));
create policy "game_presence_team_access" on public.game_presence for all to authenticated using (public.has_admin_role(array['owner','admin','moderator'])) with check (public.has_admin_role(array['owner','admin','moderator']));
