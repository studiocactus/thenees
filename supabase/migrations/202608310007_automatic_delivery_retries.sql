-- Keep abandoned leases aligned with the workers' four-attempt retry policy.
-- Transient delivery failures remain pending and are retried by the existing
-- minute scheduler; permanent failures continue to require manual action.

create or replace function public.recover_stale_bot_outbox()
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare recovered integer;
begin
  update public.bot_outbox
  set status=case when attempts>=4 then 'failed' else 'pending' end,
      last_error=case when attempts>=4 then 'worker_lease_expired' else last_error end,
      available_at=case when attempts>=4 then available_at else now() end,
      processed_at=case when attempts>=4 then now() else null end
  where status='processing' and available_at<=now();
  get diagnostics recovered=row_count;
  return recovered;
end;
$$;

revoke all on function public.recover_stale_bot_outbox() from public;
grant execute on function public.recover_stale_bot_outbox() to service_role;
