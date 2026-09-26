# HAUL design system

A store that looks like a sticker-covered cardboard box and works like a
careful checkout. The style is neo-brutalist, with commerce-grade rules
underneath it.

## Why neo-brutalism, for a shop

Commerce interfaces fail in the same ways again and again: buttons that don't
read as buttons, a pressed state nobody can see, focus rings that disappear,
and grids where every product looks the same. Neo-brutalism's building blocks
answer each of those directly:

| Brutalist device | What it does for shopping |
| --- | --- |
| 3px ink outline on every control | A button reads as a button at a glance |
| Hard offset shadow; the control sinks into it on press | Physical feedback for "added" / "placed" |
| Heavy borders | Keyboard focus (3px cobalt ring) can't be missed |
| Saturated, rationed accents | Colour carries meaning instead of decoration |
| Mono labels, big display numerals | Prices, counts and order numbers scan quickly |

The usual criticisms are that the style gets visually noisy and tiring on
dense pages, and that loud colours fail contrast (NN/g, LogRocket). They are
answered by restraint:

- Four accents, each with one job.
- A neutral body face.
- Generous padding.
- Every text pairing checked for contrast.

## Tokens

Defined once in `src/app/globals.css` (`@theme`):

| Token | Value | Job |
| --- | --- | --- |
| `paper` | `#FFF6E5` | Page background: warm, not clinical white |
| `card` | `#FFFFFF` | Surfaces that hold content |
| `ink` | `#111111` | Text, every border, every shadow |
| `muted` | `#5B5B5B` | Secondary text (6.3:1 on paper) |
| `lime` | `#C6F432` | **Act**: primary buttons, Express, progress |
| `pink` | `#FF5CA8` | **Save**: deals, discounts, sale stickers |
| `cobalt` | `#2B50FF` | **Go**: links and focus rings |
| `sun` | `#FFD23F` | **Rate**: stars and highlights |

**Contrast rule:** text is always ink on paper, card, lime, pink or sun (all
at least 7:1), or cobalt on white or paper (at least 5:1). There is never
white text on lime or pink.

Department tints (`src/lib/tint.ts`) give each image well its own colour.
Photos are shot on white and blended with `mix-blend-multiply`, so the tint
shows through.

## Type

| Role | Face | Where |
| --- | --- | --- |
| Display | Bricolage Grotesque 700/800 | Wordmark, headings, prices, big numerals |
| Body | Inter | Everything you read |
| Mono | JetBrains Mono 500/700 | Labels, stickers, the receipt, order numbers |

All three load through `next/font`, so they are self-hosted with no layout
shift.

## Shape and motion

- **Borders:** 3px ink on structure, 2px on small elements (chips, stickers).
- **Shadows:** hard and unblurred. `shadow-brut-sm` is 2px, `shadow-brut` is
  4px, `shadow-brut-lg` is 8px.
- **Radius:** 0 on structure, 6px (`rounded-brut`) on buttons and inputs,
  full on chips.
- **`press`:** on hover the control moves 2px toward its shadow; on click it
  lands flat.
- **`lift`:** product cards rise away from their shadow on hover.
- **Reduced motion:** with `prefers-reduced-motion`, all motion (including the
  deals ticker) collapses to near zero.

## Primitives (`src/components/ui`)

| Component | Use |
| --- | --- |
| `Button` / `ButtonLink` / `buttonStyles()` | Variants primary (lime), secondary (card), pink, ink and ghost, in sizes sm/md/lg. The class builder also styles `<summary>` and form-submit buttons. |
| `Sticker` | Rotated label for discounts, badges and order status |
| `Chip` | Pill link for departments and active filters, with optional × |
| `SectionHeading` | Numbered "01 / Title ——— See all →" section header |
| `Panel` | Bordered section with an ink title bar, for filters, forms and summaries |
| `Marquee` | Ticker tape (content duplicated, loops seamlessly, pauses on hover) |
| `ExpressBadge` | Lime bolt tag for 2-day shipping |
| `Field`, `inputStyles`, `FormError` | Inputs with mono stencil labels |
| `Price`, `PriceBlock` | Display dollars with raised cents, strikethrough list price, pink % tag |
| `Stars`, `RatingLine` | Sun stars with ink outlines, clipped to the exact rating |

Composites: `ProductCard` (the one tile used everywhere), `Shelf` (a
horizontal row with nudge buttons), `Wordmark`, `Container`.

## Accessibility checklist the system enforces

- **Focus:** 3px cobalt `:focus-visible` ring with a 3px offset, never
  suppressed.
- **Skip link:** the first focusable element skips to `#main`.
- **Prices:** each price has a screen-reader string ("$33.49"), while its
  visual pieces are `aria-hidden`.
- **Ratings:** the whole star row is one `role="img"` with a spoken label.
- **Header:** the account menu is a native `<details>`, which is keyboard
  operable with no JavaScript. The cart link's label includes the count.
- **Search:** it is a real `role="search"` GET form. The suggestion list is a
  combobox/listbox with `aria-activedescendant`.
- **Mobile:** `scripts/layout-check.mjs` fails the build on horizontal
  overflow at 390px or on broken images.
