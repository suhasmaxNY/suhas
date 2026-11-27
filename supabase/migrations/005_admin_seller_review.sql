-- SUHAS admin seller review RPCs.
-- Run after migrations 001-004. Only profiles with role='admin' may call these functions.

create or replace function public.admin_list_seller_applications()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode='42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id,
      'store_name', s.store_name,
      'slug', s.slug,
      'description', s.description,
      'whatsapp_number', s.whatsapp_number,
      'status', s.status,
      'created_at', s.created_at,
      'owner_email', u.email,
      'owner_name', p.full_name
    ) order by s.created_at asc)
    from public.sellers s
    join public.profiles p on p.id = s.owner_id
    join auth.users u on u.id = s.owner_id
    where s.status in ('pending','rejected','suspended')
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_review_seller(
  p_seller_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.seller_status;
  v_seller public.sellers%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode='42501';
  end if;
  if p_decision not in ('approved','rejected','suspended') then
    raise exception 'Invalid seller review decision.' using errcode='22023';
  end if;

  v_status := p_decision::public.seller_status;
  update public.sellers
     set status = v_status
   where id = p_seller_id
   returning * into v_seller;

  if not found then
    raise exception 'Seller application not found.' using errcode='P0002';
  end if;

  return jsonb_build_object(
    'id', v_seller.id,
    'store_name', v_seller.store_name,
    'status', v_seller.status
  );
end;
$$;

revoke all on function public.admin_list_seller_applications() from public, anon;
revoke all on function public.admin_review_seller(uuid, text) from public, anon;
grant execute on function public.admin_list_seller_applications() to authenticated;
grant execute on function public.admin_review_seller(uuid, text) to authenticated;
