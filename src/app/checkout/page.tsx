import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { readCart } from "@/lib/cart";
import { getProduct } from "@/lib/catalog";
import { getUser } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/checkout");

  const lines = (await readCart()).filter((l) => !l.saved);
  if (lines.length === 0) redirect("/cart");

  const items = lines
    .map((l) => ({ line: l, product: getProduct(l.asin) }))
    .filter((x) => x.product)
    .map((x) => ({
      asin: x.product!.asin,
      title: x.product!.shortTitle,
      image: x.product!.image,
      priceCents: x.product!.priceCents,
      qty: x.line.qty,
      isPrime: x.product!.isPrime,
    }));

  const defaultName =
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "";

  return <CheckoutForm items={items} defaultName={defaultName} />;
}
