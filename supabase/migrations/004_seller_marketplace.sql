-- SUHAS seller storefront, WhatsApp contact and marketplace assistant foundation.
-- Run after migrations 001-003 in Supabase SQL Editor.
alter table public.sellers
  add column if not exists whatsapp_number text,
  add column if not exists support_email text;

alter table public.sellers
  drop constraint if exists sellers_whatsapp_number_format;
alter table public.sellers
  add constraint sellers_whatsapp_number_format
  check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{8,15}$');

grant select on public.sellers to anon, authenticated;
grant insert on public.sellers to authenticated;
grant update (store_name, slug, description, whatsapp_number, support_email) on public.sellers to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.products to anon;

create or replace function public.apply_as_seller(
  p_store_name text,
  p_slug text,
  p_description text,
  p_whatsapp_number text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_seller public.sellers%rowtype;
begin
  if v_user is null then
    raise exception 'Sign in before opening a seller account.' using errcode='28000';
  end if;
  if length(trim(coalesce(p_store_name,''))) < 2 then
    raise exception 'Store name must be at least 2 characters.' using errcode='22023';
  end if;
  if p_whatsapp_number !~ '^[0-9]{8,15}$' then
    raise exception 'Enter WhatsApp number with country code, digits only.' using errcode='22023';
  end if;
  if exists(select 1 from public.sellers where owner_id=v_user) then
    raise exception 'A seller account already exists for this user.' using errcode='23505';
  end if;
  insert into public.sellers(owner_id,store_name,slug,description,whatsapp_number,status)
  values(v_user,trim(p_store_name),lower(trim(p_slug)),nullif(trim(p_description),''),p_whatsapp_number,'pending')
  returning * into v_seller;
  return jsonb_build_object('id',v_seller.id,'store_name',v_seller.store_name,'slug',v_seller.slug,'status',v_seller.status);
end;
$$;
revoke all on function public.apply_as_seller(text,text,text,text) from public, anon;
grant execute on function public.apply_as_seller(text,text,text,text) to authenticated;

create index if not exists sellers_status_idx on public.sellers(status);

-- SUHAS seller listing permissions: pending sellers may save drafts only.
drop policy if exists "seller manages own products" on public.products;
drop policy if exists "seller updates own products" on public.products;
create policy "seller creates own draft or approved listing" on public.products
for insert to authenticated
with check (
  public.is_admin()
  or (
    public.owns_seller(seller_id)
    and (
      status='draft'
      or exists(select 1 from public.sellers s where s.id=seller_id and s.status='approved')
    )
  )
);
create policy "seller updates own permitted listing" on public.products
for update to authenticated
using (public.owns_seller(seller_id) or public.is_admin())
with check (
  public.is_admin()
  or (
    public.owns_seller(seller_id)
    and (
      status<>'active'
      or exists(select 1 from public.sellers s where s.id=seller_id and s.status='approved')
    )
  )
);
