-- Store multiple approved message variants in one field.
-- The worker still selects one line and limits the outgoing message to 500 characters.

alter table public.bot_viewer_messages
  drop constraint if exists bot_viewer_messages_message_template_check;

alter table public.bot_viewer_messages
  add constraint bot_viewer_messages_message_template_check
  check (char_length(message_template) between 1 and 5000);
