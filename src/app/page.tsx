import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Rail } from "@/components/home/Rail";
import { CategoryCard, FeatureCard } from "@/components/home/CategoryCard";
import { bestSellers, byCategory, deals, topRated } from "@/lib/catalog";

/**
 * The catalogue is a static import, so this whole page prerenders at build
 * time. Nothing here touches the database.
 */
export default function HomePage() {
  const electronics = byCategory("electronics", 8);
  const computers = byCategory("computers", 8);
  const kitchen = byCategory("home-kitchen", 8);
  const fashion = byCategory("fashion", 8);
  const beauty = byCategory("beauty", 8);
  const toys = byCategory("toys", 8);
  const pets = byCategory("pets", 8);
  const books = byCategory("books", 8);
  const sports = byCategory("sports", 8);
  const tools = byCategory("tools", 8);

  return (
    <>
      {/*
        The visible hero headline rotates with the carousel, so it can't be
        the document's h1. A stable, screen-reader-only heading gives the
        page exactly one h1 without changing the layout.
      */}
      <h1 className="sr-only">
        Amazon.com: Online Shopping for Electronics, Computers, Home &amp;
        Kitchen, Fashion, Books and more
      </h1>

      <HeroCarousel />

      {/*
        Cards ride up over the hero's fade, as on amazon.com. The overlap is
        smaller on phones so it never covers the hero's call to action.
      */}
      <div className="relative z-10 -mt-[56px] px-4 sm:-mt-[80px] md:-mt-[120px] md:px-6">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <CategoryCard
              title="Get your tech fix"
              href="/s?c=electronics"
              products={electronics}
              linkLabel="Shop Electronics"
            />
            <CategoryCard
              title="Level up your setup"
              href="/s?c=computers"
              products={computers}
              linkLabel="Shop Computers"
            />
            <CategoryCard
              title="For the kitchen"
              href="/s?c=home-kitchen"
              products={kitchen}
              linkLabel="Shop Home & Kitchen"
            />
            <FeatureCard
              title="Deals you'll actually use"
              href="/deals"
              product={deals(1)[0] ?? electronics[0]}
              linkLabel="See all deals"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 md:px-6">
        <Rail
          title="Best Sellers"
          products={bestSellers(18)}
          href="/s?sort=reviews"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <CategoryCard
            title="Shoes to run in"
            href="/s?c=fashion"
            products={fashion}
            linkLabel="Shop Fashion"
          />
          <CategoryCard
            title="Skincare picks"
            href="/s?c=beauty"
            products={beauty}
            linkLabel="Shop Beauty"
          />
          <CategoryCard
            title="Build something"
            href="/s?c=toys"
            products={toys}
            linkLabel="Shop Toys & Games"
          />
          <CategoryCard
            title="For your dog"
            href="/s?c=pets"
            products={pets}
            linkLabel="Shop Pet Supplies"
          />
        </div>

        <Rail
          title="Today's Deals"
          products={deals(18)}
          href="/deals"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <CategoryCard
            title="Books worth the weekend"
            href="/s?c=books"
            products={books}
            linkLabel="Shop Books"
          />
          <CategoryCard
            title="Move more"
            href="/s?c=sports"
            products={sports}
            linkLabel="Shop Sports & Outdoors"
          />
          <CategoryCard
            title="Fix it yourself"
            href="/s?c=tools"
            products={tools}
            linkLabel="Shop Tools"
          />
          <FeatureCard
            title="Top rated across the store"
            href="/s?sort=rating"
            product={topRated(1)[0] ?? electronics[0]}
            linkLabel="See top rated"
          />
        </div>

        <Rail
          title="Highly rated"
          products={topRated(18)}
          href="/s?sort=rating"
        />
      </div>
    </>
  );
}
