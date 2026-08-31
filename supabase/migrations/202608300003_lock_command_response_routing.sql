-- Command output must always render the response selected by the exact !command.
update public.bot_automations
set message_template = '{{message}}',
    updated_at = now()
where event_key in ('command_response','moderator_feedback');

-- Old command responses must never be delivered when a later chat message
-- happens to wake a worker.
update public.bot_outbox
set status = 'failed',
    processed_at = now(),
    last_error = 'expired_command_response_blocked'
where status = 'pending'
  and event_key in ('command_response','moderator_feedback')
  and created_at < now() - interval '2 minutes';
