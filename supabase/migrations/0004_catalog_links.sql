-- Tie per-user rows to real products, and let real reviews move the rating.

-- Carts and lists can't render an unknown ASIN anyway, so drop any strays.
-- Reviews are user content: if one were orphaned, the FK below fails the push
-- loudly rather than silently deleting it.
delete from public.cart_items c where not exists (select 1 from public.products p where p.asin = c.asin);
delete from public.list_items l where not exists (select 1 from public.products p where p.asin = l.asin);

alter table public.cart_items add constraint cart_items_asin_fkey
  foreign key (asin) references public.products (asin) on delete cascade;
alter table public.list_items add constraint list_items_asin_fkey
  foreign key (asin) references public.products (asin) on delete cascade;
alter table public.reviews add constraint reviews_asin_fkey
  foreign key (asin) references public.products (asin) on delete cascade;
-- order_items deliberately has NO foreign key: it is a snapshot of what was
-- bought and must outlive a product being delisted.

create index cart_items_asin_idx on public.cart_items (asin);
create index list_items_asin_idx on public.list_items (asin);

-- Recomputes one product's HAUL review totals. Security definer because
-- shoppers may write reviews but never products.
create function public.sync_review_stats(a text) returns void
language sql security definer set search_path = '' as $$
  update public.products p
     set user_review_count = s.n,
         user_rating_sum   = s.total
    from (select count(*)::int as n, coalesce(sum(r.rating), 0)::int as total
            from public.reviews r
           where r.asin = a) s
   where p.asin = a
$$;
revoke execute on function public.sync_review_stats(text) from public, anon, authenticated;

create function public.reviews_sync_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then perform public.sync_review_stats(old.asin); end if;
  if tg_op in ('INSERT', 'UPDATE') then perform public.sync_review_stats(new.asin); end if;
  return null;
end $$;
revoke execute on function public.reviews_sync_trigger() from public, anon, authenticated;

create trigger reviews_sync_stats
  after insert or update or delete on public.reviews
  for each row execute function public.reviews_sync_trigger();

-- Backfill anything written before the trigger existed.
select public.sync_review_stats(asin) from (select distinct asin from public.reviews) r;

notify pgrst, 'reload schema';
