-- HAUL — the catalogue moves into Postgres.
--
-- 0001 kept products in a static JSON file bundled at build time. From here on
-- the database is the single source of truth: pages and the /api/v1 REST API
-- both read products, search, facets and shelves through the functions below,
-- and checkout prices every line from this table rather than trusting the
-- client or a bundled file.
--
-- Products are public-read and written only by migrations (see 0003).

-- ------------------------------------------------------------- categories
create table public.categories (
  slug       text primary key,
  name       text not null,
  short      text not null,
  sort_order smallint not null unique
);

insert into public.categories (slug, name, short, sort_order) values
  ('electronics',  'Electronics',               'Electronics',    1),
  ('computers',    'Computers & Accessories',   'Computers',      2),
  ('home-kitchen', 'Home & Kitchen',            'Home & Kitchen', 3),
  ('fashion',      'Clothing, Shoes & Jewelry', 'Fashion',        4),
  ('sports',       'Sports & Outdoors',         'Sports',         5),
  ('toys',         'Toys & Games',              'Toys & Games',   6),
  ('beauty',       'Beauty & Personal Care',    'Beauty',         7),
  ('tools',        'Tools & Home Improvement',  'Tools',          8),
  ('pets',         'Pet Supplies',              'Pet Supplies',   9),
  ('books',        'Books',                     'Books',          10);

-- --------------------------------------------------------------- products
create table public.products (
  asin                 text primary key check (asin ~ '^[A-Z0-9]{10}$'),
  title                text not null check (title <> ''),
  short_title          text not null,
  brand                text not null,
  category             text not null references public.categories (slug),
  price_cents          integer not null check (price_cents > 0),
  list_price_cents     integer check (list_price_cents > price_cents),
  -- True where the scrape had no single price (multi-variant listings) and the
  -- build generated a stable one. Kept so the data stays honest about itself.
  price_synthesised    boolean not null default false,

  -- The scraped marketplace rating, plus what HAUL shoppers have added on top.
  -- user_* are maintained by a trigger on reviews (0004); rating/review_count
  -- blend the two so every real review visibly moves the number.
  scraped_rating       numeric(2,1) not null check (scraped_rating between 0 and 5),
  scraped_review_count integer not null check (scraped_review_count >= 0),
  user_rating_sum      integer not null default 0,
  user_review_count    integer not null default 0,
  rating numeric(3,2) generated always as (
    coalesce(
      round(
        (scraped_rating * scraped_review_count + user_rating_sum)
          / nullif(scraped_review_count + user_review_count, 0),
        2),
      scraped_rating)
  ) stored,
  review_count integer generated always as (scraped_review_count + user_review_count) stored,

  image             text not null,
  images            text[] not null default '{}',
  express           boolean not null default false,
  badge             text,
  bought_past_month integer,
  bullets           text[] not null default '{}',
  stock             integer not null default 0 check (stock >= 0),
  variants          jsonb not null default '[]',
  updated_at        timestamptz not null default now()
);

create index products_category_popular_idx on public.products (category, review_count desc);
create index products_popular_idx          on public.products (review_count desc);
create index products_deals_idx            on public.products (category) where list_price_cents is not null;

alter table public.categories enable row level security;
alter table public.products   enable row level security;
create policy "categories are public" on public.categories for select using (true);
create policy "products are public"   on public.products   for select using (true);
revoke insert, update, delete, truncate on public.categories, public.products from anon, authenticated;

-- Star distribution of real HAUL reviews, per product.
create view public.review_histogram with (security_invoker = true) as
  select asin, rating as stars, count(*)::int as count
  from public.reviews
  group by asin, rating;

alter table public.reviews alter column author_name set default 'HAUL Customer';

-- ----------------------------------------------------------- search core
create function public.search_tokens(q text) returns text[]
language sql immutable set search_path = '' as $$
  select coalesce(array_agg(t), '{}')
  from regexp_split_to_table(lower(coalesce(q, '')), '[^a-z0-9+]+') t
  where length(t) > 1
$$;

-- Relevance score for one product. Every query token must hit the title or
-- the department (search is an AND); a brand hit only adds weight. A title
-- prefix beats a word-boundary hit, which beats a mid-word coincidence, so
-- "sony headphones" ranks Sony headphones above a stand that mentions Sony.
-- NULL means disqualified.
create function public.product_score(p public.products, tokens text[]) returns numeric
language sql immutable set search_path = '' as $$
  select case
    when coalesce(cardinality(tokens), 0) = 0 then 1::numeric
    when bool_and(s is not null) then sum(s) + log((p.review_count + 10)::numeric)
  end
  from (
    select
      case when lower(p.brand) = tok then 14
           when starts_with(lower(p.brand), tok) then 9
           else 0 end
      + case
          when strpos(lower(p.title), tok) = 1 then 10
          when strpos(lower(p.title), tok) > 1 then
            case when substr(lower(p.title), strpos(lower(p.title), tok) - 1, 1) ~ '\s'
                 then 6 else 2 end
          when strpos(p.category, tok) > 0 then 3
        end as s
    from unnest(tokens) as tok
  ) x
$$;

-- Every filter except `except_dim` ('brand' | 'category' | 'price' | null).
-- Facet counts ignore their own dimension, otherwise ticking one brand would
-- collapse the brand list to that brand and you could never pick a second.
create function public.search_base(
  q text, cat text, brands text[], min_price int, max_price int,
  min_rating numeric, express_only boolean, deals_only boolean,
  except_dim text default null)
returns table (asin text, score numeric)
language sql stable set search_path = public as $$
  select s.asin, s.score
  from (
    select p.*, product_score(p, t.tokens) as score
    from products p, (select search_tokens(q) as tokens) t
  ) s
  where s.score is not null
    and (except_dim = 'category' or coalesce(cat, 'all') = 'all' or s.category = cat)
    and (except_dim = 'brand' or coalesce(cardinality(brands), 0) = 0 or s.brand = any (brands))
    and (except_dim = 'price' or (
          (min_price is null or s.price_cents >= min_price)
      and (max_price is null or s.price_cents <= max_price)))
    and (min_rating is null or s.rating >= min_rating)
    and (not coalesce(express_only, false) or s.express)
    and (not coalesce(deals_only, false) or s.list_price_cents is not null)
$$;

create function public.search_products(
  q text default null, cat text default null, brands text[] default null,
  min_price int default null, max_price int default null, min_rating numeric default null,
  express_only boolean default false, deals_only boolean default false,
  sort text default 'featured', page int default 1, page_size int default 16)
returns jsonb
language plpgsql stable set search_path = public as $$
declare
  v_size  int  := least(greatest(coalesce(page_size, 16), 1), 100);
  v_sort  text := coalesce(sort, 'featured');
  v_total int;
  v_pages int;
  v_page  int;
  v_items jsonb;
begin
  select count(*) into v_total
  from search_base(q, cat, brands, min_price, max_price, min_rating, express_only, deals_only);

  v_pages := greatest(1, ceil(v_total / v_size::numeric)::int);
  -- Clamp rather than 404: page 9 of a filter that now has one page shows page 1.
  v_page  := least(greatest(coalesce(page, 1), 1), v_pages);

  select coalesce(jsonb_agg(to_jsonb(x) - 'rn' - 'score' order by x.rn), '[]'::jsonb)
    into v_items
  from (
    select p.*, b.score, row_number() over (order by
      case when v_sort = 'price-asc'  then p.price_cents end asc,
      case when v_sort = 'price-desc' then p.price_cents end desc,
      case when v_sort = 'rating'     then p.rating end desc,
      case when v_sort in ('rating', 'reviews') then p.review_count end desc,
      -- No publish date in the data; ASIN order is a stable stand-in.
      case when v_sort = 'newest'     then p.asin end desc,
      b.score desc, p.review_count desc, p.asin) as rn
    from search_base(q, cat, brands, min_price, max_price, min_rating, express_only, deals_only) b
    join products p using (asin)
    order by rn
    limit v_size offset (v_page - 1) * v_size
  ) x;

  return jsonb_build_object(
    'items', v_items, 'total', v_total, 'page', v_page,
    'pageSize', v_size, 'pageCount', v_pages);
end $$;

create function public.search_facets(
  q text default null, cat text default null, brands text[] default null,
  min_price int default null, max_price int default null, min_rating numeric default null,
  express_only boolean default false, deals_only boolean default false)
returns jsonb
language sql stable set search_path = public as $$
  with
  fb as (
    select p.brand from search_base(q, cat, brands, min_price, max_price, min_rating,
                                    express_only, deals_only, 'brand') b
    join products p using (asin)),
  fc as (
    select p.category from search_base(q, cat, brands, min_price, max_price, min_rating,
                                       express_only, deals_only, 'category') b
    join products p using (asin)),
  fp as (
    select p.price_cents from search_base(q, cat, brands, min_price, max_price, min_rating,
                                          express_only, deals_only, 'price') b
    join products p using (asin)),
  -- The top bucket's max is Number.MAX_SAFE_INTEGER, which the UI treats as "& above".
  buckets(label, lo, hi) as (values
    ('Under $25', 0, 2500), ('$25 to $50', 2500, 5000), ('$50 to $100', 5000, 10000),
    ('$100 to $200', 10000, 20000), ('$200 & above', 20000, 9007199254740991))
  select jsonb_build_object(
    'brands', coalesce((
      select jsonb_agg(jsonb_build_object('value', brand, 'count', n) order by n desc, brand)
      from (select brand, count(*)::int n from fb group by brand
            order by n desc, brand limit 12) t), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('slug', c.slug, 'name', c.name, 'count', t.n)
                       order by c.sort_order)
      from (select category, count(*)::int n from fc group by category) t
      join categories c on c.slug = t.category), '[]'::jsonb),
    'priceBuckets', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'min', lo, 'max', hi, 'count', n)
                       order by lo)
      from (select k.label, k.lo, k.hi, count(fp.price_cents)::int n
            from buckets k
            left join fp on fp.price_cents >= k.lo and fp.price_cents < k.hi
            group by k.label, k.lo, k.hi) t
      where n > 0), '[]'::jsonb))
$$;

-- ---------------------------------------------------------------- shelves

-- Anything with a struck-through list price is a deal. Ranking purely by
-- discount opens the page on a wall of budget earbuds (a few departments carry
-- inflated list prices), so rank within each department and round-robin
-- across departments, strongest department first.
create function public.deals(lim int default 40) returns setof public.products
language sql stable set search_path = public as $$
  select p.* from products p
  join (
    select asin,
           row_number() over w as lane_rank,
           max((list_price_cents - price_cents)::numeric / list_price_cents)
             over (partition by category) as lane_best
    from products
    where list_price_cents is not null
    window w as (partition by category
                 order by (list_price_cents - price_cents)::numeric / list_price_cents desc, asin)
  ) d using (asin)
  order by d.lane_rank, d.lane_best desc, p.category
  limit lim
$$;

-- Recommendations for a cart, order or list: the seeds' departments in
-- first-seen order, round-robin by popularity, topped up with best sellers so
-- a one-item cart in a thin department still gets a full shelf.
create function public.related_to_any(seeds text[], lim int default 14) returns setof public.products
language sql stable set search_path = public as $$
  with lanes as (
    select p.category, min(s.ord) as lane
    from unnest(coalesce(seeds, '{}')) with ordinality as s(asin, ord)
    join products p on p.asin = s.asin
    group by p.category
  ),
  candidates as (
    select p.asin, 0 as tier,
           row_number() over (partition by p.category order by p.review_count desc, p.asin) as rnk,
           l.lane
    from products p join lanes l on l.category = p.category
    where not (p.asin = any (coalesce(seeds, '{}')))
    union all
    select p.asin, 1, row_number() over (order by p.review_count desc, p.asin), 0
    from products p
    where not (p.asin = any (coalesce(seeds, '{}')))
  )
  select p.* from products p
  join (select distinct on (asin) asin, tier, rnk, lane
        from candidates order by asin, tier) x on x.asin = p.asin
  order by x.tier, x.rnk, x.lane
  limit lim
$$;

-- Same department, nearest in price.
create function public.also_viewed(target text, lim int default 6) returns setof public.products
language sql stable set search_path = public as $$
  select p.* from products p
  join products t on t.asin = target
  where p.category = t.category and p.asin <> t.asin
  order by abs(p.price_cents - t.price_cents), p.asin
  limit lim
$$;

-- Search-box autocomplete: brand prefixes first, then short-title fragments.
create function public.suggestions(q text, lim int default 8) returns text[]
language sql stable set search_path = public as $$
  with needle as (select lower(btrim(coalesce(q, ''))) as n),
  hits as (
    select lower(p.brand) as s, 0 as tier, p.review_count as rc
    from products p, needle
    where n <> '' and starts_with(lower(p.brand), n)
    union all
    select array_to_string((regexp_split_to_array(lower(p.short_title), '\s+'))[1:5], ' '),
           1, p.review_count
    from products p, needle
    where n <> '' and strpos(lower(p.short_title), n) > 0
  ),
  ranked as (
    select s, min(tier) as tier, max(rc) as rc
    from hits group by s
    order by min(tier), max(rc) desc
    limit least(greatest(lim, 1), 20)
  )
  select coalesce(array_agg(s order by tier, rc desc), '{}') from ranked
$$;

-- --------------------------------------------------------------- checkout

-- Places the caller's order atomically. Runs as the caller (security invoker),
-- so RLS still scopes every read and write to their own rows.
--
--  * Prices come from `products`, never from the client.
--  * Locking the cart rows serialises a double-submit: the second call waits,
--    then finds an empty cart and raises cart_empty.
--  * Only active lines are ordered and cleared; "saved for later" survives.
--  * Shipping and tax mirror src/lib/pricing.ts (integer maths on both sides).
create function public.place_order(p_ship_to jsonb, p_payment_last4 text default null)
returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_user     uuid := auth.uid();
  v_last4    text := right(regexp_replace(coalesce(p_payment_last4, ''), '\D', '', 'g'), 4);
  v_ship     jsonb;
  v_lines    int;
  v_subtotal int;
  v_express  boolean;
  v_shipping int;
  v_tax      int;
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

  perform 1 from cart_items where user_id = v_user and not saved for update;

  select count(*), sum(p.price_cents * c.qty), bool_and(p.express)
    into v_lines, v_subtotal, v_express
  from cart_items c
  join products p on p.asin = c.asin
  where c.user_id = v_user and not c.saved;

  if v_lines = 0 then
    raise exception 'cart_empty' using errcode = 'P0002';
  end if;

  v_shipping := case when v_subtotal >= 3500 then 0 else 599 end;
  v_tax      := round(v_subtotal * 725 / 10000.0);

  insert into orders (user_id, subtotal_cents, shipping_cents, tax_cents, total_cents,
                      ship_to, payment_last4, arrives_on)
  values (v_user, v_subtotal, v_shipping, v_tax, v_subtotal + v_shipping + v_tax, v_ship,
          case when length(v_last4) = 4 then v_last4 else '4242' end,
          current_date + case when v_express then 2 else 5 end)
  returning id into v_order;

  insert into order_items (order_id, asin, title, image_url, price_cents, qty)
  select v_order, p.asin, p.title, p.image, p.price_cents, c.qty
  from cart_items c
  join products p on p.asin = c.asin
  where c.user_id = v_user and not c.saved;

  delete from cart_items where user_id = v_user and not saved;

  return v_order;
end $$;

-- Supabase grants EXECUTE to anon via default privileges, so revoking from
-- PUBLIC alone would leave the function callable by signed-out clients.
revoke execute on function public.place_order(jsonb, text) from public, anon;
grant  execute on function public.place_order(jsonb, text) to authenticated;
