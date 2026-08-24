update public.site_settings
set value = jsonb_set(
  jsonb_set(value, '{email}', to_jsonb('contato@thenees.com.br'::text), true),
  '{community}', to_jsonb('https://thenees.com.br/#comunidade'::text), true
), updated_at = now()
where key = 'official_links';
