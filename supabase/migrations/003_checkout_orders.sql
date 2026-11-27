-- SUHAS real customer checkout and order creation.
-- Run after 001_init.sql and 002_security_hardening.sql in Supabase SQL Editor.
create or replace function public.place_order(
  p_items jsonb,
  p_address jsonb,
  p_payment_method public.payment_method default 'cod'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid := auth.uid();
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if v_customer is null then
    raise exception 'Please sign in before placing an order.' using errcode='28000';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'Cart must contain between 1 and 30 products.' using errcode='22023';
  end if;
  if jsonb_typeof(p_address) <> 'object'
     or coalesce(length(trim(p_address->>'recipient_name')),0) < 2
     or coalesce(length(regexp_replace(p_address->>'phone','[^0-9]','','g')),0) < 10
     or coalesce(length(trim(p_address->>'address_line')),0) < 6
     or coalesce(length(trim(p_address->>'city')),0) < 2 then
    raise exception 'Please provide a valid delivery name, phone and address.' using errcode='22023';
  end if;
  if p_payment_method <> 'cod' then
    raise exception 'Only cash on delivery is currently available.' using errcode='22023';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if coalesce((v_item->>'quantity')::integer,0) < 1 or (v_item->>'quantity')::integer > 10 then
      raise exception 'Each product quantity must be between 1 and 10.' using errcode='22023';
    end if;
    select * into v_product
      from public.products
      where id = (v_item->>'product_id')::uuid
      for update;
    if not found or v_product.status <> 'active' then
      raise exception 'A product in your cart is no longer available.' using errcode='22023';
    end if;
    if not exists(select 1 from public.sellers s where s.id=v_product.seller_id and s.status='approved') then
      raise exception 'A seller for an item in your cart is not approved.' using errcode='22023';
    end if;
    v_qty := (v_item->>'quantity')::integer;
    if v_product.stock_quantity < v_qty then
      raise exception 'Not enough stock for %.', v_product.name_en using errcode='22023';
    end if;
    v_subtotal := v_subtotal + (v_product.price_bdt * v_qty);
  end loop;

  insert into public.orders(customer_id,address_snapshot,subtotal_bdt,delivery_fee_bdt,total_bdt,payment_method,payment_status,status)
  values(v_customer,p_address,v_subtotal,0,v_subtotal,'cod','unpaid','pending')
  returning id, order_number into v_order_id,v_order_number;

  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid for update;
    v_qty := (v_item->>'quantity')::integer;
    insert into public.order_items(order_id,product_id,seller_id,product_name_snapshot,unit_price_bdt,quantity,line_total_bdt)
    values(v_order_id,v_product.id,v_product.seller_id,v_product.name_en,v_product.price_bdt,v_qty,v_product.price_bdt*v_qty);
    update public.products set stock_quantity=stock_quantity-v_qty, updated_at=now() where id=v_product.id;
  end loop;

  return jsonb_build_object('id',v_order_id,'order_number',v_order_number,'subtotal_bdt',v_subtotal,'delivery_fee_bdt',0,'total_bdt',v_subtotal,'status','pending','payment_method','cod');
end;
$$;

revoke all on function public.place_order(jsonb,jsonb,public.payment_method) from public, anon;
grant execute on function public.place_order(jsonb,jsonb,public.payment_method) to authenticated;
