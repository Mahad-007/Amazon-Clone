-- Closes the direct-write paths a review of 0001-0006 found. The anon key
-- ships to every browser, so anything PostgREST allows is public API, not
-- just what the Next app happens to call.

-- ------------------------------------------------------------------ orders
-- Orders were insertable straight through /rest/v1/orders, which let a
-- signed-in user invent their own totals. place_order() becomes the only way
-- to create one: it runs as definer (checking auth.uid() itself) and nothing
-- else may insert, update or delete.
drop policy "orders are self-insertable" on public.orders;
drop policy "order items insertable with their order" on public.order_items;
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;

drop function public.place_order(jsonb, text);

create function public.place_order(p_ship_to jsonb, p_payment_last4 text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_user     uuid := auth.uid();
  v_last4    text := right(regexp_replace(coalesce(p_payment_last4, ''), '\D', '', 'g'), 4);
  v_ship     jsonb;
  v_lines    jsonb;
  v_subtotal bigint;
  v_express  boolean;
  v_shipping int;
  v_tax      bigint;
  v_order    uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  v_ship := jsonb_build_object(
    'fullName',   left(btrim(coalesce(p_ship_to->>'fullName', '')), 120),
    'line1',      left(btrim(coalesce(p_ship_to->>'line1', '')), 200),
    'line2',      left(btrim(coalesce(p_ship_to->>'line2', '')), 200),
    'city',       left(btrim(coalesce(p_ship_to->>'city', '')), 100),
    'state',      left(btrim(coalesce(p_ship_to->>'state', '')), 100),
    'postalCode', left(btrim(coalesce(p_ship_to->>'postalCode', '')), 20),
    'country',    'United States',
    'phone',      left(btrim(coalesce(p_ship_to->>'phone', '')), 40));

  if '' in (v_ship->>'fullName', v_ship->>'line1', v_ship->>'city', v_ship->>'postalCode') then
    raise exception 'address_incomplete' using errcode = '22023';
  end if;

  -- Take the active lines in one statement. Pricing and the order items both
  -- come from exactly the rows removed here, so a line added concurrently is
  -- neither charged-and-lost nor lost-and-uncharged. Any exception below
  -- rolls the delete back.
  with taken as (
    delete from public.cart_items
     where user_id = v_user and not saved
    returning asin, qty
  )
  select coalesce(jsonb_agg(jsonb_build_object('asin', asin, 'qty', qty)), '[]'::jsonb)
    into v_lines
    from taken;

  if jsonb_array_length(v_lines) = 0 then
    raise exception 'cart_empty' using errcode = 'P0002';
  end if;

  -- Stock is a per-order cap, not a running ledger: nothing decrements it,
  -- so the demo never sells out, but no single order can exceed it.
  if exists (
    select 1
      from jsonb_to_recordset(v_lines) as l(asin text, qty int)
      join public.products p on p.asin = l.asin
     where l.qty > p.stock
  ) then
    raise exception 'out_of_stock' using errcode = '22023';
  end if;

  select sum(p.price_cents::bigint * l.qty), bool_and(p.express)
    into v_subtotal, v_express
    from jsonb_to_recordset(v_lines) as l(asin text, qty int)
    join public.products p on p.asin = l.asin;

  v_shipping := case when v_subtotal >= 3500 then 0 else 599 end;
  v_tax      := round(v_subtotal * 725 / 10000.0);

  if v_subtotal + v_shipping + v_tax > 2147483647 then
    raise exception 'order_too_large' using errcode = '22003';
  end if;

  insert into public.orders (user_id, subtotal_cents, shipping_cents, tax_cents, total_cents,
                             ship_to, payment_last4, arrives_on)
  values (v_user, v_subtotal, v_shipping, v_tax, v_subtotal + v_shipping + v_tax, v_ship,
          case when length(v_last4) = 4 then v_last4 else '4242' end,
          current_date + case when v_express then 2 else 5 end)
  returning id into v_order;

  insert into public.order_items (order_id, asin, title, image_url, price_cents, qty)
  select v_order, p.asin, p.title, p.image, p.price_cents, l.qty
    from jsonb_to_recordset(v_lines) as l(asin text, qty int)
    join public.products p on p.asin = l.asin;

  return v_order;
end $$;

revoke execute on function public.place_order(jsonb, text) from public, anon;
grant  execute on function public.place_order(jsonb, text) to authenticated;

-- ------------------------------------------------------------------- carts
-- Adding is an increment, so it must be one statement: a read-modify-write
-- in the app lost items when two adds raced (double click, two tabs).
-- Quantity is capped at 30 and at the product's stock.
create function public.cart_add(p_asin text, p_qty int)
returns int
language sql security invoker set search_path = '' as $$
  insert into public.cart_items as c (user_id, asin, qty, saved)
  select auth.uid(), p.asin, least(greatest(p_qty, 1), 30, p.stock), false
    from public.products p
   where p.asin = p_asin and auth.uid() is not null
  on conflict (user_id, asin) do update
     set qty = least(c.qty + excluded.qty, 30,
                     (select p.stock from public.products p where p.asin = excluded.asin)),
         saved = false
  returning qty
$$;
revoke execute on function public.cart_add(text, int) from public, anon;
grant  execute on function public.cart_add(text, int) to authenticated;

-- ----------------------------------------------------------------- reviews
-- Review writes go through upsert_review(), which sets the author name and
-- timestamp itself; direct inserts could forge both and store any length.
-- user_id stays unreadable to clients: the anon key would otherwise expose
-- every reviewer's auth id. Shoppers can still delete their own review
-- (RLS scopes the delete), and my_review_id() answers "which one is mine?".
alter table public.reviews
  add constraint reviews_title_len check (length(title) <= 120),
  add constraint reviews_body_len  check (length(body) between 1 and 2000);

revoke insert, update on public.reviews from anon, authenticated;
revoke select on public.reviews from anon, authenticated;
grant  select (id, asin, rating, title, body, author_name, created_at)
  on public.reviews to anon, authenticated;
drop policy "reviews are self-writable" on public.reviews;
drop policy "reviews are self-updatable" on public.reviews;

create function public.upsert_review(p_asin text, p_rating int, p_title text, p_body text)
returns table (id uuid, asin text, rating int, title text, body text,
               author_name text, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
-- The output columns share names with the table's; in SQL, mean the table.
#variable_conflict use_column
declare
  v_user uuid := auth.uid();
  v_name text;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select coalesce(nullif(btrim(pr.name), ''), split_part(u.email, '@', 1), 'HAUL Customer')
    into v_name
    from auth.users u
    left join public.profiles pr on pr.id = u.id
   where u.id = v_user;

  return query
  insert into public.reviews as r (user_id, asin, rating, title, body, author_name, created_at)
  values (v_user, p_asin, p_rating, left(btrim(coalesce(p_title, '')), 120),
          left(btrim(coalesce(p_body, '')), 2000), left(v_name, 80), now())
  on conflict (user_id, asin) do update
     set rating = excluded.rating, title = excluded.title, body = excluded.body,
         author_name = excluded.author_name, created_at = excluded.created_at
  returning r.id, r.asin, r.rating, r.title, r.body, r.author_name, r.created_at;
end $$;
revoke execute on function public.upsert_review(text, int, text, text) from public, anon;
grant  execute on function public.upsert_review(text, int, text, text) to authenticated;

create function public.my_review_id(p_asin text)
returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.reviews where user_id = auth.uid() and asin = p_asin
$$;
revoke execute on function public.my_review_id(text) from public, anon;
grant  execute on function public.my_review_id(text) to authenticated;

notify pgrst, 'reload schema';
