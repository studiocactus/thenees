-- Runtime queue hardening: fast dispatch, source verification and lease recovery.

create index if not exists bot_outbox_dispatch_idx
  on public.bot_outbox(status,target_platform,event_key,available_at,created_at desc);

create index if not exists bot_delivery_logs_platform_status_idx
  on public.bot_delivery_logs(outbox_id,platform,status);

create index if not exists platform_events_twitch_message_source_idx
  on public.platform_events((payload->>'message_id'))
  where platform='TWITCH' and event_type='channel.chat.message';

create index if not exists bot_command_events_platform_created_idx
  on public.bot_command_events(platform,created_at desc);

create or replace function public.recover_stale_bot_outbox()
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare recovered integer;
begin
  update public.bot_outbox
  set status=case when attempts>=3 then 'failed' else 'pending' end,
      last_error=case when attempts>=3 then 'worker_lease_expired' else last_error end,
      available_at=case when attempts>=3 then available_at else now() end,
      processed_at=case when attempts>=3 then now() else processed_at end
  where status='processing' and available_at<=now();
  get diagnostics recovered=row_count;
  return recovered;
end;
$$;

revoke all on function public.recover_stale_bot_outbox() from public;
grant execute on function public.recover_stale_bot_outbox() to service_role;

create or replace function public.prune_bot_runtime_history()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare deliveries_deleted integer; outbox_deleted integer; events_deleted integer; command_events_deleted integer;
begin
  delete from public.bot_delivery_logs where delivered_at<now()-interval '90 days';
  get diagnostics deliveries_deleted=row_count;
  delete from public.bot_outbox where status in ('sent','failed','cancelled') and created_at<now()-interval '90 days';
  get diagnostics outbox_deleted=row_count;
  delete from public.platform_events where occurred_at<now()-interval '30 days';
  get diagnostics events_deleted=row_count;
  delete from public.bot_command_events where created_at<now()-interval '90 days';
  get diagnostics command_events_deleted=row_count;
  return jsonb_build_object('deliveries',deliveries_deleted,'outbox',outbox_deleted,'platform_events',events_deleted,'command_events',command_events_deleted);
end;
$$;

revoke all on function public.prune_bot_runtime_history() from public;
grant execute on function public.prune_bot_runtime_history() to service_role;
