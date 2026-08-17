insert into public.featured_videos (title, video_url, thumbnail_url, published, sort_order)
select 'Melhores Momentos das Lives! #01', 'https://www.youtube.com/watch?v=eiEJdsE7pNI', 'https://i.ytimg.com/vi/eiEJdsE7pNI/maxresdefault.jpg', true, 1
where not exists (select 1 from public.featured_videos);

insert into public.schedule_events (starts_at, title, game, platform, description, published)
select * from (values
  ('2026-08-11 20:30:00-03'::timestamptz, 'GAME NIGHT', 'A DEFINIR NO ADMIN', 'TWITCH', 'Gameplay séria por aproximadamente quatro minutos.', true),
  ('2026-08-12 21:00:00-03'::timestamptz, 'LIVE DE ANIVERSÁRIO', 'A DEFINIR NO ADMIN', 'TWITCH + KICK', 'Bolo, caos e decisões coletivas.', true),
  ('2026-08-14 22:00:00-03'::timestamptz, 'SEM PLANO. PERFEITO.', 'A DEFINIR NO ADMIN', 'KICK', 'O briefing é descobrir o briefing.', true)
) as initial_schedule(starts_at, title, game, platform, description, published)
where not exists (select 1 from public.schedule_events);
