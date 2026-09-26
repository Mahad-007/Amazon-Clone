-- Fixes from `supabase db advisors` against 0001.

-- The signup trigger function is security definer; it must not be callable
-- as /rest/v1/rpc/handle_new_user.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Wrap auth.uid() in a scalar subquery so Postgres evaluates it once per
-- statement instead of once per row (lint 0003_auth_rls_initplan).
alter policy "profiles are self-readable"  on public.profiles  using ((select auth.uid()) = id);
alter policy "profiles are self-writable"  on public.profiles  with check ((select auth.uid()) = id);
alter policy "profiles are self-updatable" on public.profiles  using ((select auth.uid()) = id);
alter policy "addresses are self-managed"  on public.addresses
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "cart is self-managed"        on public.cart_items
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "lists are self-managed"      on public.list_items
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "orders are self-readable"    on public.orders using ((select auth.uid()) = user_id);
alter policy "orders are self-insertable"  on public.orders with check ((select auth.uid()) = user_id);
alter policy "order items follow their order" on public.order_items
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
alter policy "order items insertable with their order" on public.order_items
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
alter policy "reviews are self-writable"   on public.reviews with check ((select auth.uid()) = user_id);
alter policy "reviews are self-updatable"  on public.reviews using ((select auth.uid()) = user_id);
alter policy "reviews are self-deletable"  on public.reviews using ((select auth.uid()) = user_id);
