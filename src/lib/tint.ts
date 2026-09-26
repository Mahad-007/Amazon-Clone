import type { CategorySlug } from "./types";

/**
 * Each department gets a background tint for its image wells and tiles.
 * Product photos sit on white, and `mix-blend-multiply` lets the tint show
 * through the white, so a grid reads as a colourful poster instead of a wall
 * of white boxes.
 */
export const TINT: Record<CategorySlug, string> = {
  electronics: "bg-sky",
  computers: "bg-[#d9d2ff]",
  "home-kitchen": "bg-sun",
  fashion: "bg-pink-soft",
  sports: "bg-lime",
  toys: "bg-[#ffc9a8]",
  beauty: "bg-pink-soft",
  tools: "bg-sun",
  pets: "bg-[#c8f0dc]",
  books: "bg-paper-deep",
};
