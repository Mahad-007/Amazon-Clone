import type { MetadataRoute } from "next";

/**
 * Deliberately not indexable.
 *
 * This is a portfolio rebuild that reproduces amazon.com's branding and
 * serves product copy and imagery scraped from their listings. It should be
 * openly reachable by anyone with the link — that is the whole point — but it
 * has no business appearing in search results, where it would compete with
 * (and be mistaken for) the real site.
 *
 * Note this is a request to crawlers, not an access control: the site stays
 * public and needs no sign-in to view.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
