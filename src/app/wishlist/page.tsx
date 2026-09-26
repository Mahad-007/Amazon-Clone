import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient, getUser } from "@/lib/supabase/server";
import { getProducts, relatedToAny } from "@/lib/catalog";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { Shelf } from "@/components/product/Shelf";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";
import { setWishlist } from "@/app/actions/wishlist";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = { title: "Wish list" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/wishlist");

  const supabase = await createClient();
  const { data } = await supabase.from("list_items").select("asin").order("added_at", { ascending: false });

  const products = await getProducts((data ?? []).map((r) => r.asin));
  const recommended = await relatedToAny(
    products.map((p) => p.asin),
    14,
  );

  return (
    <Container className="py-8 md:py-12">
      <SectionHeading as="h1" title="Wish list">
        <span className="font-mono text-[13px] font-bold text-muted">
          {products.length} saved
        </span>
      </SectionHeading>

      {products.length === 0 ? (
        <div className="brut bg-pink px-6 py-12 text-center">
          <p className="font-display text-[32px] font-extrabold leading-tight">Nothing saved yet.</p>
          <p className="mx-auto mt-2 max-w-sm">
            Hit <strong>Save to wish list</strong> on any product and it lands here.
          </p>
          <ButtonLink href="/" variant="secondary" className="mt-6">
            Find something
          </ButtonLink>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.asin} className="flex flex-col gap-2">
              <ProductCard product={p} showAddToCart />
              {/* A plain form post, so removing works without JavaScript. */}
              <form action={setWishlist}>
                <input type="hidden" name="asin" value={p.asin} />
                <input type="hidden" name="save" value="0" />
                <button type="submit" className={buttonStyles({ variant: "ghost", size: "sm", block: true })}>
                  Remove<span className="sr-only"> {p.shortTitle} from your wish list</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {recommended.length > 0 && (
        <section className="mt-14">
          <SectionHeading title={products.length ? "Goes with your list" : "Popular right now"} />
          <Shelf products={recommended} label="Recommended products" />
        </section>
      )}
    </Container>
  );
}
