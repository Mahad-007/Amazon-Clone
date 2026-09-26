-- Normalise scraped merchandising badges.
-- The source listings produced a few artefacts: a marketplace-specific
-- program name, "Best Sellerin <category>" with a missing space, a truncated
-- countdown ("Ends in") and "Save N%", which only repeats the discount the
-- UI already computes from list price.
update public.products set badge = 'Limited time deal' where badge ilike 'limited prime deal';
update public.products set badge = 'Best Seller' where badge like 'Best Sellerin %';
update public.products set badge = null where badge = 'Ends in' or badge ~ '^Save \d+%$';
