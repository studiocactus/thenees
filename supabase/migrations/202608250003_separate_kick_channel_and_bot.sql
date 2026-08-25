update public.platform_integrations
set bot_user_id=external_user_id,
    bot_login=channel_login,
    bot_display_name=display_name,
    external_user_id='6114353',
    channel_login='thenees',
    display_name='Thenees',
    eventsub_status='pending',
    updated_at=now()
where platform='KICK';

update public.bot_channels
set channel_name='thenees',updated_at=now()
where platform='KICK';
