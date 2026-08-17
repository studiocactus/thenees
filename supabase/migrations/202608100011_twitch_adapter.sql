create schema if not exists private;
revoke all on schema private from public,anon,authenticated;

create table if not exists private.platform_tokens (
  platform text primary key,
  access_token text not null,
  refresh_token text,
  token_type text,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  external_user_id text,
  external_login text,
  updated_at timestamptz not null default now()
);

create table if not exists private.oauth_states (
  state text primary key,
  platform text not null,
  redirect_uri text not null,
  expires_at timestamptz not null default now()+interval '10 minutes',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_integrations (
  platform text primary key check(platform in ('TWITCH','KICK')),
  status text not null default 'disconnected' check(status in ('disconnected','authorization_required','configured','connected','expired','error')),
  channel_login text,
  external_user_id text,
  display_name text,
  scopes text[] not null default '{}',
  eventsub_status text not null default 'inactive' check(eventsub_status in ('inactive','pending','active','error')),
  last_synced_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_events (
  id uuid primary key default gen_random_uuid(),
  platform text not null check(platform in ('TWITCH','KICK')),
  external_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  processed boolean not null default false,
  processing_error text,
  created_at timestamptz not null default now(),
  unique(platform,external_event_id)
);

create table if not exists public.twitch_eventsub_subscriptions (
  id text primary key,
  subscription_type text not null,
  version text not null,
  status text not null,
  cost integer not null default 0,
  condition jsonb not null default '{}'::jsonb,
  created_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.platform_integrations enable row level security;
alter table public.platform_events enable row level security;
alter table public.twitch_eventsub_subscriptions enable row level security;
drop policy if exists "platform_integrations_team" on public.platform_integrations;
drop policy if exists "platform_events_team" on public.platform_events;
drop policy if exists "twitch_subscriptions_team" on public.twitch_eventsub_subscriptions;
create policy "platform_integrations_team" on public.platform_integrations for select to authenticated using(public.has_admin_role(array['owner','admin','moderator']));
create policy "platform_events_team" on public.platform_events for select to authenticated using(public.has_admin_role(array['owner','admin','moderator']));
create policy "twitch_subscriptions_team" on public.twitch_eventsub_subscriptions for select to authenticated using(public.has_admin_role(array['owner','admin','moderator']));

insert into public.platform_integrations(platform,status,channel_login) values ('TWITCH','authorization_required','thenees'),('KICK','authorization_required','thenees') on conflict(platform) do nothing;

create or replace function public.create_oauth_state(p_platform text,p_state text,p_redirect_uri text)
returns void language plpgsql security definer set search_path='' as $$
begin
  delete from private.oauth_states where expires_at<now();
  insert into private.oauth_states(state,platform,redirect_uri,created_by) values(p_state,p_platform,p_redirect_uri,auth.uid());
end; $$;
revoke all on function public.create_oauth_state(text,text,text) from public,anon,authenticated;
grant execute on function public.create_oauth_state(text,text,text) to service_role;

create or replace function public.consume_oauth_state(p_platform text,p_state text)
returns text language plpgsql security definer set search_path='' as $$
declare destination text;
begin
  delete from private.oauth_states where expires_at<now();
  delete from private.oauth_states where state=p_state and platform=p_platform and expires_at>=now() returning redirect_uri into destination;
  return destination;
end; $$;
revoke all on function public.consume_oauth_state(text,text) from public,anon,authenticated;
grant execute on function public.consume_oauth_state(text,text) to service_role;

create or replace function public.store_platform_token(p_platform text,p_access_token text,p_refresh_token text,p_token_type text,p_scopes text[],p_expires_at timestamptz,p_external_user_id text,p_external_login text)
returns void language plpgsql security definer set search_path='' as $$
begin
  insert into private.platform_tokens(platform,access_token,refresh_token,token_type,scopes,expires_at,external_user_id,external_login)
  values(p_platform,p_access_token,p_refresh_token,p_token_type,p_scopes,p_expires_at,p_external_user_id,p_external_login)
  on conflict(platform) do update set access_token=excluded.access_token,refresh_token=excluded.refresh_token,token_type=excluded.token_type,scopes=excluded.scopes,expires_at=excluded.expires_at,external_user_id=excluded.external_user_id,external_login=excluded.external_login,updated_at=now();
end; $$;
revoke all on function public.store_platform_token(text,text,text,text,text[],timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.store_platform_token(text,text,text,text,text[],timestamptz,text,text) to service_role;

create or replace function public.get_platform_token(p_platform text)
returns table(access_token text,refresh_token text,token_type text,scopes text[],expires_at timestamptz,external_user_id text,external_login text)
language sql security definer set search_path='' as $$
  select t.access_token,t.refresh_token,t.token_type,t.scopes,t.expires_at,t.external_user_id,t.external_login from private.platform_tokens t where t.platform=p_platform;
$$;
revoke all on function public.get_platform_token(text) from public,anon,authenticated;
grant execute on function public.get_platform_token(text) to service_role;

create or replace function public.disconnect_platform(p_platform text)
returns void language plpgsql security definer set search_path='' as $$
begin
  delete from private.platform_tokens where platform=p_platform;
  update public.platform_integrations set status='disconnected',eventsub_status='inactive',scopes='{}',external_user_id=null,display_name=null,last_error=null,updated_at=now() where platform=p_platform;
  update public.bot_channels set enabled=false,connection_status='disconnected',updated_at=now() where platform=p_platform;
end; $$;
revoke all on function public.disconnect_platform(text) from public,anon,authenticated;
grant execute on function public.disconnect_platform(text) to service_role;
