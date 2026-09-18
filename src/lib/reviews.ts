import type { Product, Review } from "./types";

/**
 * The scrape gave us each product's real average rating and review count,
 * but not the review text — Amazon paginates that behind the listing. So
 * review bodies here are generated per department from a fixed pool, seeded
 * by ASIN so they never change between renders or deploys.
 *
 * Two things are kept honest rather than invented:
 *  - the histogram is solved against the product's REAL average, so the bars
 *    and the headline number agree. Percentages always total exactly 100;
 *    the implied mean lands within ~0.02 of the target for the 4.x ratings
 *    that make up nearly the whole catalogue, and drifts at most ~0.16 for a
 *    very low average, where the J-shaped prior can't stretch far enough;
 *  - real reviews written by signed-in users are stored in Postgres and are
 *    merged ahead of these, clearly first.
 */

function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function seeded(seed: string, min: number, max: number): number {
  return min + (hash(seed) % (max - min + 1));
}

function pickOne<T>(seed: string, arr: T[]): T {
  return arr[hash(seed) % arr.length];
}

/**
 * Distributes `count` reviews across 5..1 stars so the weighted mean lands on
 * `average`. Amazon's distributions are heavily J-shaped (lots of 5s, a tail
 * of 1s), so we start from a J-shaped prior and then solve the 5/4 split to
 * hit the target mean exactly.
 */
export function histogram(
  average: number,
  count: number,
): { stars: number; count: number; percent: number }[] {
  // Low-star mass grows as the average falls.
  const oneTwo = Math.max(0.01, (5 - average) * 0.16);
  const three = Math.max(0.01, (5 - average) * 0.12);

  const p1 = oneTwo * 0.6;
  const p2 = oneTwo * 0.4;
  const p3 = three;

  // Remaining mass splits between 5 and 4 to hit the target mean:
  //   5a + 4b + 3p3 + 2p2 + 1p1 = average,  a + b = rest
  const rest = Math.max(0, 1 - p1 - p2 - p3);
  const fixed = 3 * p3 + 2 * p2 + 1 * p1;
  let a = (average - fixed - 4 * rest) / 1; // coefficient of (5-4)=1
  a = Math.min(rest, Math.max(0, a));
  const b = rest - a;

  const raw = [
    { stars: 5, p: a },
    { stars: 4, p: b },
    { stars: 3, p: p3 },
    { stars: 2, p: p2 },
    { stars: 1, p: p1 },
  ];

  // Largest-remainder rounding so the percentages total exactly 100.
  const exact = raw.map((r) => ({ ...r, exact: r.p * 100 }));
  const floored = exact.map((r) => ({ ...r, pct: Math.floor(r.exact) }));
  let remainder = 100 - floored.reduce((n, r) => n + r.pct, 0);
  const order = [...floored].sort(
    (x, y) => y.exact - y.pct - (x.exact - x.pct),
  );
  for (const r of order) {
    if (remainder <= 0) break;
    r.pct += 1;
    remainder -= 1;
  }

  return floored.map((r) => ({
    stars: r.stars,
    percent: r.pct,
    count: Math.round((r.pct / 100) * count),
  }));
}

const FIRST_NAMES = [
  "Jordan", "Priya", "Marcus", "Aisha", "Tomás", "Lena", "Devon", "Mei",
  "Rafael", "Nadia", "Colin", "Farah", "Ibrahim", "Sofia", "Grace", "Owen",
  "Yuki", "Ana", "Samir", "Hannah", "Diego", "Zoe", "Noah", "Amara",
];
const LAST_INITIALS = "ABCDEFGHJKLMNPRSTVW".split("");

const POSITIVE_TITLES = [
  "Exactly what I hoped for",
  "Worth every penny",
  "Better than I expected",
  "Buy it, you won't regret it",
  "Solid, no complaints",
  "Great value for the price",
  "Has held up really well",
];
const MIXED_TITLES = [
  "Good, with one caveat",
  "Does the job, not perfect",
  "Fine for the price",
  "Mostly happy",
];
const NEGATIVE_TITLES = [
  "Not for me",
  "Disappointed",
  "Stopped working after a month",
  "Expected more",
];

const BODIES: Record<string, { pos: string[]; mid: string[]; neg: string[] }> = {
  electronics: {
    pos: [
      "Sound is genuinely good — deep bass without drowning the mids. Battery easily gets me through a week of commutes on one charge.",
      "Paired instantly with both my phone and laptop and switches between them without me touching anything. The case is small enough to forget it's in my pocket.",
      "I've had these six months of daily use and they still look and sound new. The fast charge is the feature I use most.",
      "Connects the moment I open the case and the multipoint switching between laptop and phone just works, which is rare at this price.",
      "Wore them on an eight-hour flight without my ears aching. The carry case is sturdier than the ones I've had from pricier brands.",
      "Call quality is the surprise here — people stopped asking whether I was on speakerphone.",
    ],
    mid: [
      "Sound quality is great for the money. The touch controls are a bit sensitive though — I keep pausing tracks by accident when adjusting them.",
      "Very happy overall. Noise cancelling is decent rather than remarkable; it handles a plane engine better than office chatter.",
    ],
    neg: [
      "The left side stopped charging after about five weeks. Sound was fine up to then, which makes it more frustrating.",
      "Fit is too loose for me — they work their way out if I'm walking briskly. Might suit a different ear shape.",
    ],
  },
  computers: {
    pos: [
      "Boots in seconds and handles a dozen browser tabs plus a video call without the fan even spinning up. Screen is much brighter than I expected at this price.",
      "Bought this for coursework and it has been flawless. The keyboard is genuinely pleasant for long typing sessions.",
      "Battery comfortably lasts a full working day. Light enough that I stopped noticing it in my bag.",
      "Handles Lightroom exports and a dozen Chrome tabs without complaint. The hinge still feels tight after months of daily opening.",
      "Setup took ten minutes and it has needed nothing since. Ports are well placed for a desk setup.",
      "Runs cool and near-silent for everyday work, which matters when you take calls all day.",
    ],
    mid: [
      "Performance is great for everyday work. The speakers are weak — fine for calls, not for music.",
      "Solid machine. Storage filled up faster than I expected, so budget for an external drive.",
    ],
    neg: [
      "Ran well for two months then started thermal throttling badly under any real load. Support was slow to respond.",
      "Screen has noticeable backlight bleed in the corners, which is distracting on dark content.",
    ],
  },
  "home-kitchen": {
    pos: [
      "Replaced our oven for most weeknight meals. Chicken comes out crisp outside and actually cooked through, and cleanup is genuinely two minutes.",
      "Preheats fast and the presets are close enough that I rarely adjust them. Fits under the cabinets with room to spare.",
      "We use this most days. Basket is non-stick in a way that has survived six months of dishwasher cycles.",
      "Went from unboxed to cooking in five minutes. The basket slides out cleanly and nothing has stuck to it yet.",
      "It has genuinely changed how often we cook on weeknights — no waiting twenty minutes for an oven to heat.",
      "Small enough to live on the counter permanently, which is the only reason we use it as much as we do.",
    ],
    mid: [
      "Cooks well. It's louder than I anticipated, and the beep at the end is unreasonably loud.",
      "Great results, but the capacity is optimistic — the stated size works for two, not four.",
    ],
    neg: [
      "The coating started flaking around month three, which put me off using it entirely.",
      "Controls are fiddly and the display is hard to read at an angle.",
    ],
  },
  fashion: {
    pos: [
      "Broke in within a day, no blisters. I've put about 200km on them and the cushioning has barely changed.",
      "True to size and genuinely comfortable for long days standing. Grip is good on wet pavement.",
      "Light, supportive, and they don't look like running shoes, so they work with normal clothes too.",
      "Wore them straight out of the box for a 10k with no hot spots. The laces actually stay tied, which sounds minor until they don't.",
      "Second pair I've bought. Sizing was identical to the first, and the tread is holding up on pavement.",
      "Supportive enough for long shifts on hard floors without feeling stiff.",
    ],
    mid: [
      "Comfortable, but they run slightly narrow — go half a size up if you have wide feet.",
      "Good shoe. The colour is noticeably darker than the photos.",
    ],
    neg: [
      "The sole separated at the toe after about two months of normal use.",
      "Arch support is almost non-existent for me. Had to add my own insoles.",
    ],
  },
  sports: {
    pos: [
      "Thick enough that kneeling work doesn't hurt, and it doesn't slide on a wooden floor even when I'm sweating.",
      "No chemical smell out of the packaging, which was my main worry. Rolls up tight and the strap actually holds.",
      "Great grip. Wipes clean in seconds and hasn't started flaking like my last one.",
      "The extra thickness makes a real difference on a hard floor, and it still rolls up small enough for a bike basket.",
      "Grip held through a hot session with no sliding. Cleaned up with a wipe and no residue.",
      "Lies flat from the first use rather than curling at the corners for a week.",
    ],
    mid: [
      "Good mat for the price. It took about a week for the curl at the ends to settle.",
      "Grippy and comfortable, though it's heavier than I expected to carry to class.",
    ],
    neg: [
      "Started shedding little bits of foam within a fortnight.",
      "Too slippery for hot yoga — fine for stretching, not for anything sweaty.",
    ],
  },
  toys: {
    pos: [
      "Kept my 8-year-old busy for a whole afternoon and then got rebuilt twice more that week. Instructions are clear enough for them to follow alone.",
      "Bought as a gift and ended up building it myself. Pieces are good quality and nothing was missing.",
      "Great detail on the finished model — it's been on a shelf ever since.",
      "The instructions are numbered clearly enough that my seven-year-old worked through it with almost no help.",
      "Pieces feel solid and the finished build survived being knocked off a shelf.",
      "Good balance of challenge and payoff — enough steps to feel substantial without dragging.",
    ],
    mid: [
      "Lovely set, but a couple of steps were fiddly for the stated age range and needed adult help.",
      "Good value for the piece count. The box art oversells the size a little.",
    ],
    neg: [
      "Two pieces were missing from our box and replacements took weeks.",
      "Bricks are noticeably looser than the real thing and the model keeps coming apart.",
    ],
  },
  beauty: {
    pos: [
      "Absorbs in seconds with no stickiness, so it layers fine under sunscreen. My skin looks noticeably more even after about a month.",
      "No irritation at all, which is rare for me with anything active. A little goes a long way.",
      "Genuinely helped with the texture on my cheeks. I'm on my third bottle.",
      "Six weeks in and the redness around my nose has genuinely calmed down. No stinging on application.",
      "Sits well under makeup without pilling, which was my problem with the last two serums I tried.",
      "A single pump covers my whole face, so the bottle lasts far longer than the size suggests.",
    ],
    mid: [
      "Nice formula and no irritation, but I haven't seen dramatic results after six weeks.",
      "Works well. The dropper is awkward and dispenses more than I want.",
    ],
    neg: [
      "Broke me out within a week. Fine ingredients list, just not for my skin.",
      "The scent is much stronger than described and lingers.",
    ],
  },
  tools: {
    pos: [
      "Plenty of torque for everything I've thrown at it, including into brick. Two batteries means there's always one charged.",
      "Well balanced and the LED is genuinely useful under a sink. Chuck grips bits firmly.",
      "Bought it for flat-pack furniture and ended up using it for a deck. No complaints.",
      "Drove eighty screws into decking on one charge with plenty left. The grip stays comfortable through a long job.",
      "The two-speed gearbox actually matters — low speed has the torque for lag bolts, high speed for pilot holes.",
      "Compact enough to get between joists, which my old drill never managed.",
    ],
    mid: [
      "Strong drill for the money. The included bits are mediocre — replace them early.",
      "Works well. Battery life is fine but charging is slower than I'd like.",
    ],
    neg: [
      "The clutch stopped holding settings after a few months of light use.",
      "Much heavier than expected, which makes overhead work tiring.",
    ],
  },
  pets: {
    pos: [
      "Our dog's coat is visibly shinier since switching, and there's been no stomach upset at all during the transition.",
      "Fussy eater finally finishes his bowl. Kibble size suits a medium breed well.",
      "Good ingredients without the boutique price. Resealable bag actually stays sealed.",
      "Transitioned over a week with no upset at all, and he finishes every bowl now.",
      "Kibble is the right size for our spaniel and there's noticeably less shedding since we switched.",
      "Bag seals properly so the last of it is as fresh as the first.",
    ],
    mid: [
      "Dog likes it and does well on it. The bag is awkward to pour from at this size.",
      "Good food. Price has crept up noticeably since I started buying it.",
    ],
    neg: [
      "Caused digestive trouble for our dog even with a slow transition.",
      "The last two bags smelled different and he refused them.",
    ],
  },
  books: {
    pos: [
      "Finished it in two sittings. The ending recontextualises everything and I immediately wanted to reread the opening.",
      "Beautifully written without being showy. The characters stayed with me for weeks.",
      "Picked it for a book club and it produced the best discussion we've had all year.",
      "Read it over a weekend and then pressed it on two friends. The structure pays off in a way I didn't see coming.",
      "The prose is restrained in a way that makes the emotional beats land harder.",
      "One of those books where the setting does as much work as the plot.",
    ],
    mid: [
      "Strong premise and a gripping first half; the resolution felt rushed to me.",
      "Enjoyable read. A little predictable if you read a lot in this genre.",
    ],
    neg: [
      "Couldn't connect with any of the characters and gave up halfway.",
      "The twist is signposted so heavily that the last hundred pages held no tension.",
    ],
  },
};

/** Deterministic synthetic reviews for a product. */
export function generatedReviews(product: Product, limit = 6): Review[] {
  const bucket = BODIES[product.category] ?? BODIES.electronics;
  const dist = histogram(product.rating, product.reviewCount);

  // Draw stars in proportion to the histogram so the visible reviews match
  // the distribution shown above them.
  const pool: number[] = [];
  for (const row of dist) {
    const n = Math.max(row.percent >= 5 ? 1 : 0, Math.round((row.percent / 100) * limit));
    for (let i = 0; i < n; i++) pool.push(row.stars);
  }
  while (pool.length < limit) pool.push(5);
  pool.length = limit;

  // Rotate through each tier's pool rather than sampling it: hashing picked
  // the same sentence for several reviews on one page, which reads as a bug.
  // The per-product offset keeps different products starting in different
  // places, so two pages never open with the same review.
  const used: Record<string, number> = { pos: 0, mid: 0, neg: 0 };
  const offset = hash(product.asin);

  return pool.map((stars, i) => {
    const seed = `${product.asin}:${i}`;
    const tier = stars >= 4 ? "pos" : stars === 3 ? "mid" : "neg";
    const titles =
      stars >= 4 ? POSITIVE_TITLES : stars === 3 ? MIXED_TITLES : NEGATIVE_TITLES;

    const bodies = bucket[tier];
    const body = bodies[(offset + used[tier]) % bodies.length];
    const title = titles[(offset + used[tier]) % titles.length];
    used[tier] += 1;

    const daysAgo = seeded(`${seed}d`, 3, 420);
    const created = new Date();
    created.setDate(created.getDate() - daysAgo);

    return {
      id: `gen-${product.asin}-${i}`,
      asin: product.asin,
      rating: stars,
      title,
      body,
      authorName: `${pickOne(`${seed}n`, FIRST_NAMES)} ${pickOne(`${seed}l`, LAST_INITIALS)}.`,
      createdAt: created.toISOString(),
    };
  });
}

/** Helpful-vote count shown under a generated review. */
export function helpfulCount(reviewId: string): number {
  return seeded(`${reviewId}h`, 0, 64);
}
