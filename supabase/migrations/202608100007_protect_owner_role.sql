create or replace function public.protect_owner_admin_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'owner' and public.current_admin_role() <> 'owner' then
    raise exception 'Only the owner can change the owner account';
  end if;
  if tg_op = 'UPDATE' and new.role = 'owner' and public.current_admin_role() <> 'owner' then
    raise exception 'Only the owner can assign the owner role';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end; $$;

drop trigger if exists protect_owner_admin_user_trigger on public.admin_users;
create trigger protect_owner_admin_user_trigger before update or delete on public.admin_users for each row execute function public.protect_owner_admin_user();
