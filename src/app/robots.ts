import type { MetadataRoute } from "next";

/**
 * Deliberately not indexable.
 *
 * HAUL is a take-home project serving product copy and imagery from public
 * marketplace listings. It should be openly reachable by anyone with the
 * link (that is the whole point) but has no business appearing in search
 * results next to the real listings.
 *
 * Note this is a request to crawlers, not an access control: the site stays
 * public and needs no sign-in to view.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
