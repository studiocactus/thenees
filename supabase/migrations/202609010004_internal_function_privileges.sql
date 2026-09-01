-- Trigger helpers and bot runtime routines are internal implementation details.
-- Explicitly clear grants that may have been inherited from earlier schema-wide
-- defaults, while preserving the public contact and authenticated invite flows.

revoke all on function public.increment_bot_user_counter(uuid,text,text,text,text,date) from public, anon, authenticated;
grant execute on function public.increment_bot_user_counter(uuid,text,text,text,text,date) to service_role;

revoke all on function public.prune_bot_runtime_history() from public, anon, authenticated;
grant execute on function public.prune_bot_runtime_history() to service_role;

revoke all on function public.recover_stale_bot_outbox() from public, anon, authenticated;
grant execute on function public.recover_stale_bot_outbox() to service_role;

revoke all on function public.protect_owner_admin_user() from public, anon, authenticated;
revoke all on function public.queue_new_player() from public, anon, authenticated;
revoke all on function public.queue_published_quote() from public, anon, authenticated;

