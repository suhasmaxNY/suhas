-- SUHAS.COM seller lifecycle and order integrity hardening
-- Apply after migrations 001 and 002.

grant insert on public.sellers to authenticated;

create or replace function public.owns_approved_seller(target_seller uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.sellers where id=target_seller and owner_id=auth.uid() and status='approved'); $$;

drop policy if exists "seller manages own products" on public.products;
drop policy if exists "seller updates own products" on public.products;
drop policy if exists "seller deletes own products" on public.products;

create policy "seller creates draft products" on public.products
for insert to authenticated with check (public.owns_seller(seller_id) and status='draft');
create policy "approved seller updates own products" on public.products
for update to authenticated
using (public.owns_approved_seller(seller_id) or public.is_admin())
with check (public.owns_approved_seller(seller_id) or public.is_admin());
create policy "approved seller deletes own products" on public.products
for delete to authenticated using (public.owns_approved_seller(seller_id) or public.is_admin());

-- Checkout will use a trusted transactional database function after stock and price validation.
-- Do not allow browser clients to submit forged totals or order items.
drop policy if exists "customers create own orders" on public.orders;
revoke insert on public.orders from authenticated;
revoke insert on public.order_items from authenticated;
