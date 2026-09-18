/** A product as it appears everywhere in the UI. */
export type Product = {
  asin: string;
  title: string;
  /** Short display title used in dense grids and the cart. */
  shortTitle: string;
  brand: string;
  /** Price in cents — money is never a float in this codebase. */
  priceCents: number;
  /** Pre-discount price, when the item is on sale. */
  listPriceCents: number | null;
  rating: number;
  reviewCount: number;
  image: string;
  /** Extra gallery shots, derived from the primary image. */
  images: string[];
  category: CategorySlug;
  isPrime: boolean;
  badge: string | null;
  /** e.g. "2K+ bought in past month" — Amazon's social-proof line. */
  boughtPastMonth: number | null;
  bullets: string[];
  /** Deterministic stock figure so "Only N left" is stable across renders. */
  stock: number;
  variants: Variant[];
};

export type Variant = {
  kind: "Color" | "Size" | "Style" | "Capacity";
  options: string[];
};

export type CategorySlug =
  | "electronics"
  | "computers"
  | "home-kitchen"
  | "fashion"
  | "sports"
  | "toys"
  | "beauty"
  | "tools"
  | "pets"
  | "books";

export type Category = {
  slug: CategorySlug;
  name: string;
  /** Shown in the departments dropdown and breadcrumbs. */
  short: string;
};

export const CATEGORIES: Category[] = [
  { slug: "electronics", name: "Electronics", short: "Electronics" },
  { slug: "computers", name: "Computers & Accessories", short: "Computers" },
  { slug: "home-kitchen", name: "Home & Kitchen", short: "Home & Kitchen" },
  { slug: "fashion", name: "Clothing, Shoes & Jewelry", short: "Fashion" },
  { slug: "sports", name: "Sports & Outdoors", short: "Sports" },
  { slug: "toys", name: "Toys & Games", short: "Toys & Games" },
  { slug: "beauty", name: "Beauty & Personal Care", short: "Beauty" },
  { slug: "tools", name: "Tools & Home Improvement", short: "Tools" },
  { slug: "pets", name: "Pet Supplies", short: "Pet Supplies" },
  { slug: "books", name: "Books", short: "Books" },
];

export type CartLine = {
  asin: string;
  qty: number;
  saved: boolean;
};

export type Address = {
  id: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

export type OrderItem = {
  asin: string;
  title: string;
  imageUrl: string;
  priceCents: number;
  qty: number;
};

export type Order = {
  id: string;
  placedAt: string;
  status: "confirmed" | "shipped" | "delivered" | "cancelled";
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shipTo: Omit<Address, "id" | "isDefault">;
  paymentLast4: string;
  arrivesOn: string;
  items: OrderItem[];
};

export type Review = {
  id: string;
  asin: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  /** True when written by the signed-in viewer. */
  mine?: boolean;
};
