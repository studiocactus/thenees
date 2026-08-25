-- !lurker is a shared community command and must behave identically on both chats.
update public.bot_commands
set platform_scope = 'BOTH',
    updated_at = now()
where command = '!lurker'
  and platform_scope is distinct from 'BOTH';
