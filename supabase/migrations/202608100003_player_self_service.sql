create policy "game_players_self_read" on public.game_players
for select to authenticated using (auth_user_id = auth.uid());

create policy "game_players_self_insert" on public.game_players
for insert to authenticated with check (auth_user_id = auth.uid());

create policy "game_players_self_update" on public.game_players
for update to authenticated using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

create policy "game_presence_self_read" on public.game_presence
for select to authenticated using (
  exists (select 1 from public.game_players where id = player_id and auth_user_id = auth.uid())
);

create policy "game_presence_self_insert" on public.game_presence
for insert to authenticated with check (
  exists (select 1 from public.game_players where id = player_id and auth_user_id = auth.uid())
);

create policy "game_presence_self_update" on public.game_presence
for update to authenticated using (
  exists (select 1 from public.game_players where id = player_id and auth_user_id = auth.uid())
) with check (
  exists (select 1 from public.game_players where id = player_id and auth_user_id = auth.uid())
);
