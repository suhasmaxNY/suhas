-- SUHAS admin account provisioning.
-- Run only after the intended user has registered with this exact email.
-- This changes only the matching profile role; it does not create or modify auth credentials.
do $$
declare
  v_updated integer;
begin
  update public.profiles p
     set role = 'admin'::public.account_role,
         updated_at = now()
    from auth.users u
   where u.id = p.id
     and lower(u.email) = lower('flhasnain.info@gmail.com');

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise notice 'No matching profile found. Register and verify flhasnain.info@gmail.com, then rerun this migration.';
  else
    raise notice 'Admin role assigned to flhasnain.info@gmail.com.';
  end if;
end $$;
