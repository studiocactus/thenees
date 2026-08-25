alter table private.oauth_states
  add column if not exists code_verifier text;

create or replace function public.create_oauth_state_pkce(
  p_platform text,
  p_state text,
  p_redirect_uri text,
  p_code_verifier text
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  delete from private.oauth_states where expires_at < now();
  insert into private.oauth_states(state, platform, redirect_uri, code_verifier, created_by)
  values (p_state, upper(p_platform), p_redirect_uri, p_code_verifier, auth.uid());
end;
$$;

revoke all on function public.create_oauth_state_pkce(text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_oauth_state_pkce(text,text,text,text) to service_role;

create or replace function public.consume_oauth_state_pkce(p_platform text, p_state text)
returns table(redirect_uri text, code_verifier text)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  delete from private.oauth_states where expires_at < now();
  return query
  delete from private.oauth_states
  where state = p_state
    and platform = upper(p_platform)
    and expires_at >= now()
  returning private.oauth_states.redirect_uri, private.oauth_states.code_verifier;
end;
$$;

revoke all on function public.consume_oauth_state_pkce(text,text) from public, anon, authenticated;
grant execute on function public.consume_oauth_state_pkce(text,text) to service_role;
