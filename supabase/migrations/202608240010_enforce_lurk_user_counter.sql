update public.bot_commands
set command_type = 'user_counter',
    updated_at = now()
where command = '!lurk'
  and command_type is distinct from 'user_counter';
