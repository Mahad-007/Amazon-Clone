import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

const COLUMNS = [
  {
    title: "Get to Know Us",
    links: ["Careers", "Blog", "About Amazon", "Investor Relations", "Devices"],
  },
  {
    title: "Make Money with Us",
    links: [
      "Sell products on Amazon",
      "Sell on Amazon Business",
      "Become an Affiliate",
      "Advertise Your Products",
      "Self-Publish with Us",
    ],
  },
  {
    title: "Payment Products",
    links: [
      "Business Card",
      "Shop with Points",
      "Reload Your Balance",
      "Currency Converter",
    ],
  },
  {
    title: "Let Us Help You",
    links: [
      "Your Account",
      "Your Orders",
      "Shipping Rates & Policies",
      "Returns & Replacements",
      "Help",
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-8">
      <Link
        href="#top"
        className="block bg-squid py-4 text-center text-[13px] text-white hover:bg-navy-hover"
      >
        Back to top
      </Link>

      <div className="bg-navy-light px-6 py-10 text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-2 text-[16px] font-bold">{col.title}</h3>
              <ul className="space-y-1.5 text-[13px] text-[#ddd]">
                {col.links.map((l) => (
                  <li key={l}>
                    <span className="cursor-default hover:underline">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-navy px-6 py-8 text-center text-[12px] text-[#ddd]">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/s?c=${c.slug}`} className="hover:underline">
                {c.short}
              </Link>
            ))}
          </p>
          <p className="text-[#999]">
            A portfolio rebuild of amazon.com — not affiliated with Amazon.
            Product data and imagery are scraped from public Amazon search
            results for demonstration purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}
