-- Remove historical duplicate delivery markers and enforce one successful
-- delivery per outbox item and platform from this point forward.

update public.bot_outbox
set status='cancelled',processed_at=now(),last_error='stale_prelaunch_item_cancelled'
where status='pending' and created_at<now()-interval '10 minutes';

with ranked as (
  select id,row_number() over(partition by outbox_id,platform order by delivered_at,id) as position
  from public.bot_delivery_logs
  where status='sent' and outbox_id is not null
)
delete from public.bot_delivery_logs logs
using ranked
where logs.id=ranked.id and ranked.position>1;

create unique index if not exists bot_delivery_logs_one_sent_per_platform_idx
  on public.bot_delivery_logs(outbox_id,platform)
  where status='sent' and outbox_id is not null;
