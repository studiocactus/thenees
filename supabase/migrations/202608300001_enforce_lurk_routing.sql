-- Keep the canonical lurk behavior consistent across Twitch and Kick.
update public.bot_commands
set command_type = 'user_counter',
    platform_scope = 'BOTH',
    response_template = '@{{display_name}} ativou o modo lurk pela {{user_count}}ª vez hoje. Presente, silencioso e oficialmente contabilizado.',
    updated_at = now()
where command = '!lurk';
