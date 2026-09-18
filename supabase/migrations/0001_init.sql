-- Amazon clone — core schema.
-- The product catalogue is NOT in Postgres: it ships as a static JSON file in
-- the repo so search/filter/sort run in-process with no network hop. Postgres
-- owns only the things that are genuinely per-user and must persist: identity,
-- addresses, carts, lists, orders and reviews.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  name        text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are self-readable"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles are self-writable"
  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles are self-updatable"
  on public.profiles for update using (auth.uid() = id);

-- Mirror new auth users into profiles so we always have a display name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------- addresses
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  full_name   text not null,
  line1       text not null,
  line2       text not null default '',
  city        text not null,
  state       text not null default '',
  postal_code text not null,
  country     text not null default 'United States',
  phone       text not null default '',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists addresses_user_idx on public.addresses (user_id);
alter table public.addresses enable row level security;

create policy "addresses are self-managed"
  on public.addresses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------- cart + list
-- Cart rows are keyed by (user, asin) so incrementing quantity is an upsert.
create table if not exists public.cart_items (
  user_id    uuid not null references auth.users on delete cascade,
  asin       text not null,
  qty        integer not null default 1 check (qty > 0 and qty <= 30),
  saved      boolean not null default false,  -- "Save for later"
  added_at   timestamptz not null default now(),
  primary key (user_id, asin)
);

alter table public.cart_items enable row level security;
create policy "cart is self-managed"
  on public.cart_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.list_items (
  user_id    uuid not null references auth.users on delete cascade,
  asin       text not null,
  added_at   timestamptz not null default now(),
  primary key (user_id, asin)
);

alter table public.list_items enable row level security;
create policy "lists are self-managed"
  on public.list_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------------ orders
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  placed_at       timestamptz not null default now(),
  status          text not null default 'confirmed'
                  check (status in ('confirmed','shipped','delivered','cancelled')),
  subtotal_cents  integer not null,
  shipping_cents  integer not null default 0,
  tax_cents       integer not null default 0,
  total_cents     integer not null,
  ship_to         jsonb not null,         -- snapshot: addresses can change later
  payment_last4   text not null default '4242',
  arrives_on      date not null
);

create index if not exists orders_user_idx on public.orders (user_id, placed_at desc);
alter table public.orders enable row level security;

create policy "orders are self-readable"
  on public.orders for select using (auth.uid() = user_id);
create policy "orders are self-insertable"
  on public.orders for insert with check (auth.uid() = user_id);

-- Line items snapshot title/image/price: the catalogue may change, an order
-- must not.
create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders on delete cascade,
  asin         text not null,
  title        text not null,
  image_url    text not null default '',
  price_cents  integer not null,
  qty          integer not null check (qty > 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);
alter table public.order_items enable row level security;

create policy "order items follow their order"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  ));
create policy "order items insertable with their order"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  ));

-- ----------------------------------------------------------------- reviews
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  asin        text not null,
  rating      integer not null check (rating between 1 and 5),
  title       text not null default '',
  body        text not null default '',
  author_name text not null default 'Amazon Customer',
  created_at  timestamptz not null default now(),
  unique (user_id, asin)
);

create index if not exists reviews_asin_idx on public.reviews (asin, created_at desc);
alter table public.reviews enable row level security;

-- Reviews are public reading, self-only writing.
create policy "reviews are world-readable"
  on public.reviews for select using (true);
create policy "reviews are self-writable"
  on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews are self-updatable"
  on public.reviews for update using (auth.uid() = user_id);
create policy "reviews are self-deletable"
  on public.reviews for delete using (auth.uid() = user_id);
