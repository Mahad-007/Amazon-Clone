import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient, getUser } from "@/lib/supabase/server";
import { getProducts, relatedToAny } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Rail } from "@/components/home/Rail";

export const metadata: Metadata = { title: "Your Wish List" };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/wishlist");

  const supabase = await createClient();
  const { data } = (await supabase
    ?.from("list_items")
    .select("asin")
    .order("added_at", { ascending: false })) ?? { data: [] };

  const products = getProducts((data ?? []).map((r) => r.asin as string));

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5">
      <h1 className="mb-4 text-[28px] text-ink">Your Wish List</h1>

      {products.length === 0 ? (
        <div className="bg-white px-6 py-10 text-center">
          <h2 className="mb-2 text-[21px] font-bold text-ink">
            Your list is empty
          </h2>
          <p className="mb-4 text-[14px] text-[#565959]">
            Use <span className="font-bold">Add to List</span> on any product
            page to save it for later.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-cta px-5 py-1.5 text-[14px] text-ink hover:bg-cta-hover"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.asin} product={p} showAddToCart />
          ))}
        </div>
      )}

      <div className="mt-6">
        <Rail
          title="Related to items on your list"
          products={relatedToAny(products, 14)}
        />
      </div>
    </div>
  );
}
